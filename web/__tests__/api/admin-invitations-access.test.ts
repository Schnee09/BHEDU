/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/invitations/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

type InvitationHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, InvitationHandler, 'GET' | 'POST']> = [
  ['invitation list', GET, 'GET'],
  ['invitation creation', POST, 'POST'],
];

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost/api/admin/invitations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({}) : undefined,
  });
}

describe('admin invitation authorization', () => {
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
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'users.invite');
  });

  it.each(handlers)('returns 403 for %s without users.invite', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'users.invite');
  });
});
