/**
 * @jest-environment node
 */
import { GET } from '@/app/api/teacher/grades/route';
import { getAuthContext } from '@/lib/auth/guard';
import { classService, studentService } from '@/lib/services';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services', () => ({
  gradeService: {},
  classService: { getClasses: jest.fn() },
  studentService: { getStudentGrades: jest.fn() },
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/repositories/GradeRepository', () => ({ GradeRepository: jest.fn() }));

describe('GET /api/teacher/grades student scope', () => {
  it('loads a student grades only from classes taught by the teacher', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    });
    (classService.getClasses as jest.Mock).mockResolvedValue({
      classes: [{ id: 'class-1' }, { id: 'class-2' }],
    });
    (studentService.getStudentGrades as jest.Mock)
      .mockResolvedValueOnce([{ id: 'grade-1', class_id: 'class-1' }])
      .mockResolvedValueOnce([{ id: 'grade-2', class_id: 'class-2' }]);

    const request: any = new Request('http://localhost/api/teacher/grades?studentId=student-1');
    request.nextUrl = {
      pathname: '/api/teacher/grades',
      searchParams: new URL(request.url).searchParams,
    };
    const response = await GET(request, { params: Promise.resolve({}) } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(studentService.getStudentGrades).toHaveBeenNthCalledWith(1, 'student-1', 'class-1');
    expect(studentService.getStudentGrades).toHaveBeenNthCalledWith(2, 'student-1', 'class-2');
    expect(body.data).toHaveLength(2);
  });
});
