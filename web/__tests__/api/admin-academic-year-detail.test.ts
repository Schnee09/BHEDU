/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PATCH } from '@/app/api/admin/academic-years/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const context = { params: Promise.resolve({ id: 'year-1' }) };

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  return new Request('http://localhost/api/admin/academic-years/year-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ name: '2026-2027' }) : undefined,
  }) as NextRequest;
}

describe('/api/admin/academic-years/[id] authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires an authenticated profile for detail reads', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'), context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', GET, 'classes.view'],
    ['PATCH', PATCH, 'classes.manage'],
    ['DELETE', DELETE, 'classes.manage'],
  ] as const)(
    'returns 403 for %s without the required permission',
    async (method, handler, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'teacher-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method), context);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), permission);
      expect(getDataClient).not.toHaveBeenCalled();
    }
  );
});
