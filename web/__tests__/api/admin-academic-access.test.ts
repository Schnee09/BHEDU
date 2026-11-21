/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_CLASSES, POST as POST_CLASS } from '@/app/api/admin/classes/route';
import {
  DELETE as DELETE_GRADE,
  GET as GET_GRADE,
  PATCH as PATCH_GRADE,
} from '@/app/api/admin/grades/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/classService', () => ({ ClassService: {} }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

type AcademicHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, AcademicHandler, 'GET' | 'POST' | 'PATCH' | 'DELETE', string]> = [
  ['class list', GET_CLASSES, 'GET', 'classes.view'],
  ['class creation', POST_CLASS, 'POST', 'classes.create'],
  ['grade detail', GET_GRADE, 'GET', 'grades.view'],
  ['grade update', PATCH_GRADE, 'PATCH', 'grades.manage'],
  ['grade deletion', DELETE_GRADE, 'DELETE', 'grades.delete'],
];

function request(method: 'GET' | 'POST' | 'PATCH' | 'DELETE') {
  const hasBody = method === 'POST' || method === 'PATCH';
  return new NextRequest('http://localhost/api/admin/academic/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: hasBody ? JSON.stringify({}) : undefined,
  });
}

describe('admin academic authorization', () => {
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
    'returns 403 for %s without its academic permission',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'staff-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});
