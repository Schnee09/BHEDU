/**
 * Tests for StudentService
 *
 * Stable and Simplified (Phase 8)
 */

const mockSupabase: any = {
  from: jest.fn(),
  auth: { admin: { createUser: jest.fn(), deleteUser: jest.fn() } },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
  createServiceClient: jest.fn(() => mockSupabase),
}));

import { NotFoundError, ValidationError } from '@/lib/api/errors';
// @ts-ignore
const { StudentService, studentService } = require('@/lib/services/studentService');

describe('StudentService', () => {
  let fluentMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    fluentMock = {};
    fluentMock.select = jest.fn().mockReturnValue(fluentMock);
    fluentMock.eq = jest.fn().mockReturnValue(fluentMock);
    fluentMock.or = jest.fn().mockReturnValue(fluentMock);
    fluentMock.in = jest.fn().mockReturnValue(fluentMock);
    fluentMock.order = jest.fn().mockReturnValue(fluentMock);
    fluentMock.range = jest.fn().mockReturnValue(fluentMock);
    fluentMock.limit = jest.fn().mockReturnValue(fluentMock);
    fluentMock.single = jest.fn().mockReturnValue(fluentMock);
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

  describe('enrollStudent', () => {
    it('should enroll', async () => {
      // 1st then (check existing)
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: null, error: null })
      );
      // 2nd then (insert result)
      fluentMock.then.mockImplementationOnce((resolve: (value: any) => void) =>
        resolve({ data: { id: 'e1' }, error: null })
      );

      const service = new StudentService(mockSupabase);
      const enrollment = await service.enrollStudent('1', 'c1');
      expect(enrollment.id).toBe('e1');
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
