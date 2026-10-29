/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/attendance/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';

jest.mock('@/lib/repositories/AttendanceRepository');
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));

const classQuery = {
  select: jest.fn(),
  eq: jest.fn(),
};
classQuery.select.mockReturnValue(classQuery);

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => classQuery),
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
  const request: any = new Request(`http://localhost/api/attendance${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  request.nextUrl = {
    pathname: '/api/attendance',
    searchParams: new URLSearchParams(search.replace(/^\?/, '')),
  };
  return request;
}

describe('/api/attendance authorization', () => {
  const findAll = jest.fn();
  const create = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockResolvedValue({ data: [{ id: 'class-1' }], error: null });
    findAll.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 });
    (AttendanceRepository as jest.Mock).mockImplementation(() => ({ findAll, create }));
    (canAccessClass as jest.Mock).mockResolvedValue(true);
  });

  it('limits an unfiltered teacher query to assigned classes', async () => {
    const response = await GET(createRequest('GET'), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ class_ids: ['class-1'] }));
  });

  it('rejects a teacher requesting an unassigned class', async () => {
    const response = await GET(
      createRequest('GET', '?class_id=123e4567-e89b-12d3-a456-426614174000'),
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(response.status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('rejects creating attendance for an inaccessible class', async () => {
    (canAccessClass as jest.Mock).mockResolvedValue(false);
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        class_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2026-10-29',
        status: 'present',
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });
});
