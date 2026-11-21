/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_SYSTEM_HEALTH } from '@/app/api/admin/system/health/route';
import { POST as POST_REFRESH_VIEWS } from '@/app/api/admin/system/refresh-views/route';
import { GET as GET_SETTINGS, PUT as PUT_SETTINGS } from '@/app/api/admin/settings/route';
import {
  GET as GET_NOTIFICATION_SETTINGS,
  PUT as PUT_NOTIFICATION_SETTINGS,
} from '@/app/api/admin/notifications/settings/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

type SystemHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, SystemHandler, 'GET' | 'POST' | 'PUT', string]> = [
  ['system health', GET_SYSTEM_HEALTH, 'GET', 'system.settings'],
  ['performance view refresh', POST_REFRESH_VIEWS, 'POST', 'system.database'],
  ['settings list', GET_SETTINGS, 'GET', 'system.settings'],
  ['settings update', PUT_SETTINGS, 'PUT', 'system.settings'],
  ['notification settings list', GET_NOTIFICATION_SETTINGS, 'GET', 'system.settings'],
  ['notification settings update', PUT_NOTIFICATION_SETTINGS, 'PUT', 'system.settings'],
];

function request(method: 'GET' | 'POST' | 'PUT') {
  const hasBody = method !== 'GET';
  return new NextRequest('http://localhost/api/admin/system-test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: hasBody ? JSON.stringify({}) : undefined,
  });
}

describe('admin system authorization', () => {
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
    'returns 403 for %s without its system permission',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'admin-1' },
        role: 'admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});
