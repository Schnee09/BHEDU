/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/announcements/route';
import { DELETE, PUT } from '@/app/api/admin/announcements/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

type AnnouncementHandler = (request: NextRequest) => Promise<Response>;
const routeContext = { params: Promise.resolve({ id: 'announcement-1' }) };

const handlers: Array<[string, AnnouncementHandler, 'GET' | 'POST' | 'PUT' | 'DELETE']> = [
  ['announcement list', GET, 'GET'],
  ['announcement creation', POST, 'POST'],
  ['announcement update', (request) => PUT(request, routeContext), 'PUT'],
  ['announcement deletion', (request) => DELETE(request, routeContext), 'DELETE'],
];

function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
  const hasBody = method === 'POST' || method === 'PUT';
  return new NextRequest('http://localhost/api/admin/announcements', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: hasBody ? JSON.stringify({}) : undefined,
  });
}

describe('admin announcement authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'announcements.manage');
  });

  it.each(handlers)(
    'returns 403 for %s without announcements.manage',
    async (_name, handler, method) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'staff-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'announcements.manage');
    }
  );
});
