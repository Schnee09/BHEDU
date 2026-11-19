/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/attendance/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const attendanceQuery: Record<string, jest.Mock> = {};
for (const method of ['select', 'eq', 'insert', 'update']) {
  attendanceQuery[method] = jest.fn(() => attendanceQuery);
}
attendanceQuery.single = jest.fn();

function request(method: 'GET' | 'POST') {
  const value = new Request('http://localhost/api/admin/attendance', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:
      method === 'POST'
        ? JSON.stringify({
            student_id: '11111111-1111-4111-8111-111111111111',
            class_id: '22222222-2222-4222-8222-222222222222',
            date: '2026-11-19',
            status: 'present',
          })
        : undefined,
  }) as NextRequest;
  Object.defineProperty(value, 'nextUrl', {
    value: { searchParams: new URLSearchParams() },
  });
  return value;
}

describe('/api/admin/attendance authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of ['select', 'eq', 'insert', 'update']) {
      attendanceQuery[method]!.mockReturnValue(attendanceQuery);
    }
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: { from: jest.fn(() => attendanceQuery) },
    } as unknown as Awaited<ReturnType<typeof getDataClient>>);
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'attendance.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', GET, 'attendance.view'],
    ['POST', POST, 'attendance.manage'],
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

  it('records the authenticated profile when creating attendance', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    attendanceQuery
      .single!.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'attendance-1' }, error: null });

    const response = await POST(request('POST'));

    expect(response.status).toBe(200);
    expect(attendanceQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        marked_by: 'admin-1',
        status: 'present',
      })
    );
  });
});
