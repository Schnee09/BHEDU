/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PATCH } from '@/app/api/classes/[classId]/route';
import { GET as GET_STUDENTS } from '@/app/api/classes/[classId]/students/route';
import { GET as GET_ENROLLMENTS } from '@/app/api/classes/[classId]/enrollments/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/ClassRepository', () => ({ ClassRepository: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getRateLimitIdentifier: jest.fn(() => 'test'),
  rateLimitConfigs: { api: {} },
}));
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }));

const context = { params: Promise.resolve({ classId: 'class-1' }) };

type ClassHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, ClassHandler, 'GET' | 'PATCH' | 'DELETE', string]> = [
  ['class detail', (request) => GET(request, context), 'GET', 'classes.view'],
  ['class update', (request) => PATCH(request, context), 'PATCH', 'classes.edit'],
  ['class deletion', (request) => DELETE(request, context), 'DELETE', 'classes.delete'],
  ['class students', (request) => GET_STUDENTS(request, context), 'GET', 'classes.view'],
  ['class enrollments', (request) => GET_ENROLLMENTS(request, context), 'GET', 'classes.view'],
];

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  return new NextRequest('http://localhost/api/classes/class-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ name: 'Lớp mới' }) : undefined,
  });
}

describe('class detail authorization', () => {
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
    'returns 403 for %s without its class permission',
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
