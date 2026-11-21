/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PATCH } from '@/app/api/attendance/[id]/route';
import { GET as GET_STATS } from '@/app/api/attendance/stats/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/AttendanceRepository', () => ({
  AttendanceRepository: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getRateLimitIdentifier: jest.fn(() => 'test'),
  rateLimitConfigs: { api: {} },
}));
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }));

const context = { params: Promise.resolve({ id: 'attendance-1' }) };

type AttendanceHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, AttendanceHandler, 'GET' | 'PATCH' | 'DELETE', string]> = [
  ['attendance detail', (request) => GET(request, context), 'GET', 'attendance.view'],
  ['attendance update', (request) => PATCH(request, context), 'PATCH', 'attendance.manage'],
  ['attendance deletion', (request) => DELETE(request, context), 'DELETE', 'attendance.manage'],
  ['attendance statistics', GET_STATS, 'GET', 'attendance.view'],
];

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  return new NextRequest('http://localhost/api/attendance/test?classId=class-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ status: 'present' }) : undefined,
  });
}

describe('attendance authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)(
    'returns 401 for %s without a profile',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: null,
        role: null,
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(401);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );

  it.each(handlers)(
    'returns 403 for %s without its attendance permission',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'student-1' },
        role: 'student',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});
