/**
 * Tests for StudentService
 *
 * Stable and Simplified (Phase 8)
 */

const mockSupabase: any = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: { admin: { createUser: jest.fn(), deleteUser: jest.fn() } },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
  createServiceClient: jest.fn(() => mockSupabase),
}));

// @ts-ignore
const { StudentService } = require('@/lib/services/studentService');

describe('StudentService', () => {
  let fluentMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    fluentMock = {};
    fluentMock.select = jest.fn().mockReturnValue(fluentMock);
    fluentMock.eq = jest.fn().mockReturnValue(fluentMock);
    fluentMock.is = jest.fn().mockReturnValue(fluentMock);
    fluentMock.or = jest.fn().mockReturnValue(fluentMock);
    fluentMock.in = jest.fn().mockReturnValue(fluentMock);
    fluentMock.order = jest.fn().mockReturnValue(fluentMock);
    fluentMock.range = jest.fn().mockReturnValue(fluentMock);
    fluentMock.limit = jest.fn().mockReturnValue(fluentMock);
    fluentMock.single = jest.fn().mockReturnValue(fluentMock);
    fluentMock.maybeSingle = jest.fn().mockReturnValue(fluentMock);
    fluentMock.insert = jest.fn().mockReturnValue(fluentMock);
    fluentMock.update = jest.fn().mockReturnValue(fluentMock);
    fluentMock.delete = jest.fn().mockReturnValue(fluentMock);
    fluentMock.upsert = jest.fn().mockReturnValue(fluentMock);
    fluentMock.then = jest.fn((resolve: (value: any) => void) =>
      resolve({ data: null, error: null })
    );

    mockSupabase.from.mockReturnValue(fluentMock);
  });

  describe('getStudents', () => {
    it('should return students', async () => {
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: [{ id: '1', full_name: 'John' }], error: null, count: 1 })
      );
      const service = new StudentService(mockSupabase);
      const result = await service.getStudents();
      expect(result.students).toHaveLength(1);
    });
  });

  describe('getStudentById', () => {
    it('should return student', async () => {
      // 1st then (student query)
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: { id: '1', full_name: 'John' }, error: null })
      );
      // 2nd then (enrollments query)
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: [], error: null })
      );

      const service = new StudentService(mockSupabase);
      const student = await service.getStudentById('1');
      expect(student.full_name).toBe('John');
    });
  });

  describe('getStudentGrades', () => {
    it('filters traditional and assignment grades by the grade class_id', async () => {
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: [], error: null })
      );

      await new StudentService(mockSupabase).getStudentGrades('student-1', 'class-1');

      expect(fluentMock.eq).toHaveBeenCalledWith('student_id', 'student-1');
      expect(fluentMock.eq).toHaveBeenCalledWith('class_id', 'class-1');
      expect(fluentMock.eq).not.toHaveBeenCalledWith('assignments.class_id', 'class-1');
    });
  });

  describe('getStudentAttendance', () => {
    it('excludes soft-deleted attendance records', async () => {
      await new StudentService(mockSupabase).getStudentAttendance('student-1', 'class-1');

      expect(fluentMock.eq).toHaveBeenCalledWith('student_id', 'student-1');
      expect(fluentMock.eq).toHaveBeenCalledWith('class_id', 'class-1');
      expect(fluentMock.is).toHaveBeenCalledWith('deleted_at', null);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'e1' }, error: null });

      const service = new StudentService(mockSupabase);
      const enrollment = await service.enrollStudent('1', 'c1');
      expect(enrollment.id).toBe('e1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'enroll_student_atomic',
        expect.objectContaining({ p_student_id: '1', p_class_id: 'c1' })
      );
    });

    it('creates a new effective-dated period through the lifecycle RPC', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { id: 'enrollment-2', status: 'enrolled' },
        error: null,
      });

      const enrollment = await new StudentService(mockSupabase).enrollStudent(
        'student-1',
        'class-1'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'enroll_student_atomic',
        expect.objectContaining({ p_student_id: 'student-1', p_class_id: 'class-1' })
      );
      expect(fluentMock.insert).not.toHaveBeenCalled();
      expect(enrollment.status).toBe('enrolled');
    });
  });

  describe('unenrollStudent', () => {
    it('records the end date on the active enrollment', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-24T18:30:00Z'));
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: { id: 'enrollment-1' }, error: null })
      );
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { id: 'enrollment-1', status: 'withdrawn' },
        error: null,
      });

      try {
        await new StudentService(mockSupabase).unenrollStudent('student-1', 'class-1');
      } finally {
        jest.useRealTimers();
      }

      expect(mockSupabase.rpc).toHaveBeenCalledWith('end_enrollment_atomic', {
        p_enrollment_id: 'enrollment-1',
        p_end_date: '2026-10-25',
        p_status: 'withdrawn',
        p_reason: 'Rút khỏi lớp',
        p_actor_id: null,
      });
    });
  });

  describe('Static methods', () => {
    it('delegates to singleton', async () => {
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: { id: '1', full_name: 'Static' }, error: null })
      );
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: [], error: null })
      );
      const student = await StudentService.getStudentById('1');
      expect(student.full_name).toBe('Static');
    });
  });
});
