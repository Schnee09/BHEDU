/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/invitations/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

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

  it('hides invitations for roles above the current administrator', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const query = {
      select: jest.fn(),
      order: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        { id: 'invite-owner', role: 'owner', email: 'owner@example.com' },
        { id: 'invite-teacher', role: 'teacher', email: 'teacher@example.com' },
      ],
      error: null,
    });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await GET(request('GET'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.invites).toEqual([
      { id: 'invite-teacher', role: 'teacher', email: 'teacher@example.com' },
    ]);
  });

  it('requires at least one invitation contact method', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const invalidRequest = new NextRequest('http://localhost/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'teacher', email: '', phone: '' }),
    });

    const response = await POST(invalidRequest);

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
