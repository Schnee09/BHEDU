/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/grades/route';
import { canAccessClass } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));

const ASSIGNED_CLASS_ID = '123e4567-e89b-12d3-a456-426614174000';
const OTHER_CLASS_ID = '323e4567-e89b-12d3-a456-426614174000';

const classQuery = { select: jest.fn(), eq: jest.fn() };
const gradeQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  in: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn((table: string) => (table === 'classes' ? classQuery : gradeQuery)),
  })),
}));

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1', email: 'teacher@example.com' },
    role: 'teacher',
  }),
}));

function createRequest(method: 'GET' | 'POST', search = '', body?: unknown) {
  const request: any = new Request(`http://localhost/api/grades${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  request.nextUrl = {
    pathname: '/api/grades',
    searchParams: new URLSearchParams(search.replace(/^\?/, '')),
  };
  return request;
}

describe('/api/grades authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockResolvedValue({ data: [{ id: ASSIGNED_CLASS_ID }], error: null });
    gradeQuery.select.mockReturnValue(gradeQuery);
    gradeQuery.eq.mockReturnValue(gradeQuery);
    gradeQuery.in.mockResolvedValue({ data: [], error: null });
    (canAccessClass as jest.Mock).mockResolvedValue(true);
  });

  it('scopes an unfiltered teacher query to assigned classes', async () => {
    const response = await GET(createRequest('GET'), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(gradeQuery.in).toHaveBeenCalledWith('class_id', [ASSIGNED_CLASS_ID]);
  });

  it('rejects a teacher requesting an unassigned class', async () => {
    const response = await GET(createRequest('GET', `?class_id=${OTHER_CLASS_ID}`), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(gradeQuery.select).not.toHaveBeenCalled();
  });

  it('rejects creating a grade for an inaccessible class', async () => {
    (canAccessClass as jest.Mock).mockResolvedValue(false);
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        class_id: OTHER_CLASS_ID,
        subject_id: '423e4567-e89b-12d3-a456-426614174000',
        score: 8,
        component_type: 'midterm',
        semester: '1',
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(403);
    expect(gradeQuery.in).not.toHaveBeenCalled();
  });
});
