/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/students/route';
import { getAuthContext } from '@/lib/auth/guard';
import { StudentRepository } from '@/lib/repositories/StudentRepository';
import { studentService } from '@/lib/services/studentService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/StudentRepository');
jest.mock('@/lib/services/studentService', () => ({
  studentService: { getStudents: jest.fn() },
}));

function request() {
  const value: any = new Request('http://localhost/api/admin/students');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/students scope', () => {
  const findByTeacher = jest.fn();
  const findById = jest.fn();
  const countByStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    findByTeacher.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25 });
    countByStatus.mockResolvedValue({ active: 0, inactive: 0 });
    (StudentRepository as jest.Mock).mockImplementation(() => ({
      findByTeacher,
      findById,
      countByStatus,
    }));
    jest.mocked(studentService.getStudents).mockResolvedValue({
      students: [],
      total: 0,
      page: 1,
      pageSize: 25,
    } as Awaited<ReturnType<typeof studentService.getStudents>>);
  });

  it('scopes a custom role to students in assigned classes', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'coordinator-1' },
      role: 'academic_coordinator',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(findByTeacher).toHaveBeenCalledWith(
      'coordinator-1',
      expect.objectContaining({ pageSize: 25 })
    );
    expect(studentService.getStudents).not.toHaveBeenCalled();
    expect(countByStatus).not.toHaveBeenCalled();
  });

  it('keeps center-wide data and statistics for staff', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(studentService.getStudents).toHaveBeenCalled();
    expect(countByStatus).toHaveBeenCalled();
    expect(findByTeacher).not.toHaveBeenCalled();
  });
});
