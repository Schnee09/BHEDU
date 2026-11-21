/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_MY_CLASSES } from '@/app/api/classes/my-classes/route';
import { GET as GET_ALL_TIMETABLE } from '@/app/api/timetable/all/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
  logRequest: jest.fn(),
  logResponse: jest.fn(),
}));
jest.mock('@/lib/repositories/TimetableRepository', () => ({
  TimetableRepository: jest.fn(),
}));

const handlers = [
  ['my classes', GET_MY_CLASSES, 'classes.view'],
  ['complete timetable', GET_ALL_TIMETABLE, 'timetable.view'],
] as const;

function request() {
  return new NextRequest('http://localhost/api/classes/schedule');
}

describe('class and schedule authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)('returns 401 for %s without a profile', async (_name, handler, permission) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request());

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
  });

  it.each(handlers)(
    'returns 403 for %s without its permission',
    async (_name, handler, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'user-1' },
        role: 'student',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request());

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});
