/**
 * @jest-environment node
 */
import { GET } from '@/app/api/students/[id]/grade-history/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

function query(result: Record<string, unknown>) {
  const builder: any = { ...result };
  for (const method of ['select', 'eq', 'is']) {
    builder[method] = jest.fn(() => builder);
  }
  builder.single = jest.fn().mockResolvedValue(result);
  builder.order = jest.fn().mockResolvedValue(result);
  return builder;
}

describe('GET /api/students/[id]/grade-history', () => {
  it('queries current semester columns and excludes deleted grades', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    });
    (canAccessStudent as jest.Mock).mockResolvedValue(true);

    const profileQuery = query({
      data: {
        id: 'student-1',
        full_name: 'Nguyễn Văn A',
        student_code: 'HS-1',
        grade_level: '9',
      },
      error: null,
    });
    const gradesQuery = query({ data: [], error: null });
    const semestersQuery = query({ data: [], error: null });
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(profileQuery)
        .mockReturnValueOnce(gradesQuery)
        .mockReturnValueOnce(semestersQuery),
    };
    (createServiceClient as jest.Mock).mockReturnValue(supabase);

    const response = await GET(
      new Request('http://localhost/api/students/student-1/grade-history') as any,
      { params: Promise.resolve({ id: 'student-1' }) }
    );

    expect(response.status).toBe(200);
    expect(gradesQuery.select).toHaveBeenCalledWith(expect.stringContaining('semester,'));
    expect(gradesQuery.select).toHaveBeenCalledWith(expect.stringContaining('academic_year_id'));
    expect(gradesQuery.select).toHaveBeenCalledWith(expect.not.stringContaining('semester_id'));
    expect(gradesQuery.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
