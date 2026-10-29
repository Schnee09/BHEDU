/**
 * @jest-environment node
 */
import { GET } from '@/app/api/grades/rankings/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/cache/cache', () => ({
  CACHE_TTL: { SHORT: 60 },
  cached: jest.fn((_key, loader) => loader()),
}));

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const classQuery = { select: jest.fn(), eq: jest.fn() };
const gradeQuery = { select: jest.fn(), in: jest.fn() };
const profileQuery = { select: jest.fn(), in: jest.fn() };
const rpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    rpc,
    from: jest.fn((table: string) => {
      if (table === 'classes') return classQuery;
      if (table === 'grades') return gradeQuery;
      return profileQuery;
    }),
  })),
}));

function request(search = '') {
  const value: any = new Request(`http://localhost/api/grades/rankings${search}`);
  value.nextUrl = {
    pathname: '/api/grades/rankings',
    searchParams: new URLSearchParams(search.replace(/^\?/, '')),
  };
  return value;
}

function authenticate(role: string, id = 'teacher-1') {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('GET /api/grades/rankings authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockResolvedValue({ data: [{ id: 'class-1', name: 'Toán 9' }], error: null });
    gradeQuery.select.mockReturnValue(gradeQuery);
    gradeQuery.in.mockResolvedValue({
      data: [
        { student_id: 'student-1', class_id: 'class-1', score: 8 },
        { student_id: 'student-1', class_id: 'class-1', score: 6 },
      ],
      error: null,
    });
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.in.mockResolvedValue({
      data: [{ id: 'student-1', full_name: 'Nguyễn An' }],
      error: null,
    });
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it('ignores a teacher_id supplied by a teacher and uses the authenticated profile', async () => {
    authenticate('teacher');

    const response = await GET(request('?teacher_id=teacher-2'), {
      params: Promise.resolve({}),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(classQuery.eq).toHaveBeenCalledWith('teacher_id', 'teacher-1');
    expect(gradeQuery.in).toHaveBeenCalledWith('class_id', ['class-1']);
    expect(body.topStudents[0]).toMatchObject({
      studentId: 'student-1',
      className: 'Toán 9',
      average: 7,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('allows an administrator to request a selected teacher scope', async () => {
    authenticate('admin', 'admin-1');

    const response = await GET(request('?teacher_id=teacher-2'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(classQuery.eq).toHaveBeenCalledWith('teacher_id', 'teacher-2');
  });

  it('rejects students instead of returning center-wide rankings', async () => {
    authenticate('student', 'student-1');

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});
