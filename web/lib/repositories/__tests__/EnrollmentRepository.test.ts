/**
 * Unit Tests for EnrollmentRepository
 *
 * Tests repository pattern implementation with mocked Supabase client.
 */

import { EnrollmentRepository } from '../EnrollmentRepository';

describe('EnrollmentRepository', () => {
  let mockSupabase: any;
  let repository: EnrollmentRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    repository = new EnrollmentRepository(mockSupabase);
  });

  describe('findByStudent', () => {
    it('should fetch enrollments with detailed class and teacher info', async () => {
      const studentId = 'student-123';
      const mockEnrollments = [
        {
          id: 'enr-1',
          student_id: studentId,
          class_id: 'class-1',
          class: {
            id: 'class-1',
            name: 'Math 101',
            code: 'M101',
            schedule: 'Mon 08:00-10:00',
            teacher: { id: 'teacher-1', full_name: 'John Smith' },
          },
        },
      ];

      const orderMock = jest.fn().mockResolvedValue({
        data: mockEnrollments,
        error: null,
      });

      const eqMock = jest.fn().mockReturnValue({
        order: orderMock,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: eqMock,
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      });

      const result = await repository.findByStudent(studentId);

      expect(result).toEqual(mockEnrollments);
      expect(mockSupabase.from).toHaveBeenCalledWith('enrollments');
      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining('teacher:profiles!classes_teacher_id_fkey')
      );
      expect(eqMock).toHaveBeenCalledWith('student_id', studentId);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB Error' },
            }),
          }),
        }),
      });

      await expect(repository.findByStudent('id')).rejects.toThrow(
        'Failed to fetch student enrollments: DB Error'
      );
    });
  });

  describe('transferStudent', () => {
    it('should transfer an active enrollment atomically', async () => {
      const studentId = 'student-1';
      const fromClassId = 'class-old';
      const toClassId = 'class-new';
      const existingEnrollment = {
        id: 'enr-old',
        student_id: studentId,
        class_id: fromClassId,
        status: 'enrolled',
      };
      const newEnrollment = {
        id: 'enr-new',
        student_id: studentId,
        class_id: toClassId,
        status: 'enrolled',
      };

      // Mock findByStudentAndClass
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: existingEnrollment,
        error: null,
      });
      const eq3Mock = jest.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      });
      const eq2Mock = jest.fn().mockReturnValue({ eq: eq3Mock });
      const eq1Mock = jest.fn().mockReturnValue({
        eq: eq2Mock,
      });

      mockSupabase.rpc = jest.fn().mockResolvedValue({ data: newEnrollment, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'enrollments') {
          return {
            select: jest.fn().mockImplementation((query: string) => {
              if (query === '*') return { eq: eq1Mock };
              return {};
            }),
          };
        }
        return {};
      });

      const result = await repository.transferStudent(studentId, fromClassId, toClassId);

      expect(result).toEqual(newEnrollment);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'transfer_student_atomic',
        expect.objectContaining({
          p_enrollment_id: existingEnrollment.id,
          p_to_class_id: toClassId,
        })
      );
    });

    it('should throw error if student is not enrolled in source class', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });

      await expect(repository.transferStudent('s1', 'c1', 'c2')).rejects.toThrow(
        'Student is not enrolled in the source class'
      );
    });
  });

  describe('isEnrolled', () => {
    it('should return true if enrolled enrollment exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await repository.isEnrolled('s1', 'c1');
      expect(result).toBe(true);
    });
  });
});
