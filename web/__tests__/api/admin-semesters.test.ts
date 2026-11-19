/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/semesters/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

function request(method: 'GET' | 'POST') {
  return new Request('http://localhost/api/admin/semesters', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:
      method === 'POST'
        ? JSON.stringify({
            name: 'Học kỳ 1',
            code: 'HK1',
            start_date: '2026-08-01',
            end_date: '2026-12-31',
          })
        : undefined,
  });
}

describe('/api/admin/semesters authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', GET, 'classes.view'],
    ['POST', POST, 'classes.manage'],
  ] as const)(
    'returns 403 for %s without the required permission',
    async (method, handler, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'teacher-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), permission);
      expect(getDataClient).not.toHaveBeenCalled();
    }
  );
});
