/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PATCH } from '@/app/api/admin/attendance/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const context = { params: Promise.resolve({ id: 'attendance-1' }) };

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  return new NextRequest('http://localhost/api/admin/attendance/attendance-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ status: 'present' }) : undefined,
  });
}

describe('/api/admin/attendance/[id] authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'), context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'attendance.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', GET, 'attendance.view'],
    ['PATCH', PATCH, 'attendance.manage'],
    ['DELETE', DELETE, 'attendance.manage'],
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
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
      expect(getDataClient).not.toHaveBeenCalled();
    }
  );
});
