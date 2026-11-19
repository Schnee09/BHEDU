/**
 * @jest-environment node
 */
import { DELETE, PATCH, PUT } from '@/app/api/admin/semesters/[id]/route';
import { POST as ACTIVATE } from '@/app/api/admin/semesters/[id]/activate/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const context = { params: Promise.resolve({ id: 'semester-1' }) };

function request(method: 'PUT' | 'PATCH' | 'DELETE' | 'POST') {
  return new Request('http://localhost/api/admin/semesters/semester-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PUT' || method === 'PATCH' ? JSON.stringify({ name: 'Học kỳ 1' }) : undefined,
  });
}

describe('admin semester mutation authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await PUT(request('PUT'), context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.manage');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it.each([
    ['PUT', PUT],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
    ['ACTIVATE', ACTIVATE],
  ] as const)('returns 403 for %s without classes.manage', async (method, handler) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const requestMethod = method === 'ACTIVATE' ? 'POST' : method;
    const response = await handler(request(requestMethod), context);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.manage');
    expect(getDataClient).not.toHaveBeenCalled();
  });
});
