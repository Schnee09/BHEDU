/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/subjects/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/cache', () => ({
  CACHE_KEYS: { SUBJECTS_ALL: 'subjects:all' },
  CACHE_TTL: { MEDIUM: 300 },
  cached: jest.fn(),
  invalidateCache: jest.fn(),
}));

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost/api/subjects', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({}) : undefined,
  });
}

describe('subjects authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['subject list', GET, 'GET' as const, undefined],
    ['subject creation', POST, 'POST' as const, 'subjects.manage'],
  ])('returns 401 for %s without a profile', async (_name, handler, method, permission) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(
      expect.any(NextRequest),
      ...(permission ? [permission] : [])
    );
  });

  it('returns 403 when creating a subject without subjects.manage', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request('POST'));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'subjects.manage');
  });
});
