/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, PATCH } from '@/app/api/grades/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/GradeRepository', () => ({ GradeRepository: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getRateLimitIdentifier: jest.fn(() => 'test'),
  rateLimitConfigs: { api: {} },
}));

const context = { params: Promise.resolve({ id: 'grade-1' }) };

type GradeHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, GradeHandler, 'GET' | 'PATCH' | 'DELETE', string]> = [
  ['grade detail', (request) => GET(request, context), 'GET', 'grades.view'],
  ['grade update', (request) => PATCH(request, context), 'PATCH', 'grades.manage'],
  ['grade deletion', (request) => DELETE(request, context), 'DELETE', 'grades.delete'],
];

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  return new NextRequest('http://localhost/api/grades/grade-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ score: 8 }) : undefined,
  });
}

describe('grade detail authorization', () => {
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
    'returns 403 for %s without its grade permission',
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
