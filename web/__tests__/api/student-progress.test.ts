/**
 * @jest-environment node
 */
import { GET } from '@/app/api/students/[id]/progress/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { createClientFromRequest } from '@/lib/supabase/server';
import { settingsService } from '@/lib/services/settingsService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({
  createClientFromRequest: jest.fn(),
  createServiceClient: jest.fn(() => ({})),
}));
jest.mock('@/lib/services/settingsService', () => ({
  settingsService: { getAcademicContext: jest.fn() },
}));

function query(result: Record<string, unknown>) {
  const builder: any = {};
  for (const method of ['select', 'eq', 'or', 'in', 'is', 'order']) {
    builder[method] = jest.fn(() => builder);
  }
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  builder.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

describe('GET /api/students/[id]/progress', () => {
  it('normalizes semester, score, academic year, and class attendance', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    });
    (canAccessStudent as jest.Mock).mockResolvedValue(true);
    (settingsService.getAcademicContext as jest.Mock).mockResolvedValue({
      academicYear: { id: 'year-current', name: '2026-2027' },
      semester: { id: 'semester-1', name: 'Học kỳ 1', code: '2026-2027-HK1' },
    });

    const results: Record<string, Record<string, unknown>> = {
      profiles: {
        data: {
          id: 'student-1',
          full_name: 'Nguyễn Văn A',
          student_id: 'CID-1',
          student_code: 'HS-1',
          grade_level: '9',
          role: 'student',
        },
        error: null,
      },
      enrollments: {
        data: [{ class_id: 'class-1', classes: { id: 'class-1', name: 'Lớp 9A' } }],
        error: null,
      },
      grades: {
        data: [
          {
            id: 'grade-1',
            score: 8,
            points_earned: 40,
            component_type: 'midterm',
            semester: '1',
            academic_year_id: 'year-old',
            class_id: 'class-1',
            subject: { id: 'math', name: 'Toán', code: 'MATH' },
            class: { id: 'class-1', name: 'Lớp 9A' },
          },
          {
            id: 'grade-2',
            score: null,
            points_earned: 50,
            semester: '2025-2026-HK1',
            academic_year_id: 'year-old',
            class_id: 'class-1',
            subject: { id: 'math', name: 'Toán', code: 'MATH' },
            class: { id: 'class-1', name: 'Lớp 9A' },
          },
          {
            id: 'grade-3',
            score: 6,
            points_earned: 6,
            component_type: 'final',
            semester: '2025-2026-HK1',
            academic_year_id: 'year-old',
            class_id: 'class-1',
            subject: { id: 'math', name: 'Toán', code: 'MATH' },
            class: { id: 'class-1', name: 'Lớp 9A' },
          },
        ],
        error: null,
      },
      attendance: {
        data: [
          { id: 'attendance-1', class_id: 'class-1', status: 'present', date: '2025-10-10' },
          { id: 'attendance-2', class_id: 'class-2', status: 'absent', date: '2025-10-10' },
          { id: 'attendance-3', class_id: 'class-1', status: 'absent', date: '2026-03-10' },
        ],
        error: null,
      },
      academic_years: {
        data: [{ id: 'year-old', name: '2025-2026' }],
        error: null,
      },
      conduct_grades: {
        data: [
          {
            academic_year_id: 'year-old',
            semester: '2025-2026-HK1',
            conduct_grade: 'Kha',
          },
        ],
        error: null,
      },
      semesters: {
        data: [
          {
            code: '2025-2026-HK1',
            start_date: '2025-09-01',
            end_date: '2026-01-15',
          },
        ],
        error: null,
      },
    };
    const queries: Record<string, any> = {};
    const supabase = {
      from: jest.fn((table: string) => {
        queries[table] = query(results[table]!);
        return queries[table];
      }),
    };
    (createClientFromRequest as jest.Mock).mockReturnValue(supabase);

    const response = await GET(new Request('http://localhost/api/students/student-1/progress'), {
      params: Promise.resolve({ id: 'student-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.semesters).toHaveLength(1);
    expect(body.data.semesters[0]).toMatchObject({
      semester: 'Học kỳ 1',
      academic_year: '2025-2026',
      gpa: 7,
      attendance_rate: 100,
      conduct: 'Khá',
    });
    expect(body.data.semesters[0].subjects[0]).toMatchObject({
      final_grade: 7,
      semester_1_grade: 7,
      semester_2_grade: null,
    });
    expect(queries.enrollments.is).toHaveBeenCalledWith('deleted_at', null);
    expect(queries.attendance.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
