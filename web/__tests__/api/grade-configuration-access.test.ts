/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  GET as GET_ASSIGNMENTS,
  POST as POST_ASSIGNMENT,
} from '@/app/api/grades/assignments/route';
import { GET as GET_CATEGORIES, POST as POST_CATEGORY } from '@/app/api/grades/categories/route';
import { GET as GET_STUDENT_OVERVIEW } from '@/app/api/grades/student-overview/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }));

type GradeConfigurationHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, GradeConfigurationHandler, 'GET' | 'POST', string]> = [
  ['assignment list', GET_ASSIGNMENTS, 'GET', 'grades.view'],
  ['assignment creation', POST_ASSIGNMENT, 'POST', 'grades.manage'],
  ['category list', GET_CATEGORIES, 'GET', 'grades.view'],
  ['category creation', POST_CATEGORY, 'POST', 'grades.manage'],
  ['student overview', GET_STUDENT_OVERVIEW, 'GET', 'grades.view'],
];

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost/api/grades/configuration', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({}) : undefined,
  });
}

describe('grade configuration authorization', () => {
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
