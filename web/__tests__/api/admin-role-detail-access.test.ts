/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, PUT } from '@/app/api/admin/roles/[code]/route';
import { GET as GET_ROLES, POST as POST_ROLE } from '@/app/api/admin/roles/route';
import { getAuthContext } from '@/lib/auth/guard';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const context = { params: Promise.resolve({ code: 'office_staff' }) };

function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: object) {
  return new NextRequest('http://localhost/api/admin/roles/office_staff', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('admin role detail authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['role update', (req: NextRequest) => PUT(req, context), 'PUT' as const],
    ['role deletion', (req: NextRequest) => DELETE(req, context), 'DELETE' as const],
  ])('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'permissions.manage');
  });

  it.each([
    ['role update', (req: NextRequest) => PUT(req, context), 'PUT' as const],
    ['role deletion', (req: NextRequest) => DELETE(req, context), 'DELETE' as const],
  ])('returns 403 for %s without permissions.manage', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
  });

  it('prevents a non-super-admin from delegating a permission they do not have', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'owner-1' },
      role: 'owner',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await PUT(
      request('PUT', { name: 'Nhân viên', permissions: ['system.settings'] }),
      context
    );

    expect(response.status).toBe(403);
    expect(resolveServerPermission).toHaveBeenCalledWith('owner-1', 'owner', 'system.settings');
  });

  it.each([
    ['owner', 'owner'],
    ['admin', 'office_staff'],
    ['permission_manager', 'office_staff'],
  ])('prevents %s from updating protected role %s', async (actorRole, targetRole) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'manager-1' },
      role: actorRole,
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const targetContext = { params: Promise.resolve({ code: targetRole }) };

    const response = await PUT(request('PUT', { name: 'Vai trò mới' }), targetContext);

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('returns conflict for a duplicate custom role without using a fallback table', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'super-1' },
      role: 'super_admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const from = jest.fn().mockImplementation((table: string) => {
      if (table !== 'custom_roles') {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        insert: jest.fn().mockResolvedValue({
          error: { code: '23505', message: 'duplicate key' },
        }),
      };
    });
    jest.mocked(createServiceClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await POST_ROLE(
      request('POST', { code: 'office_staff', name: 'Nhân viên văn phòng' })
    );

    expect(response.status).toBe(409);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('custom_roles');
  });

  it('prevents an owner from deleting the owner role', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'owner-1' },
      role: 'owner',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const ownerContext = { params: Promise.resolve({ code: 'owner' }) };

    const response = await DELETE(request('DELETE'), ownerContext);

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('prevents deleting a custom role used by an active invitation', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'super-1' },
      role: 'super_admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const profilesQuery = {
      select: jest.fn(),
      eq: jest.fn(),
    };
    profilesQuery.select.mockReturnValue(profilesQuery);
    profilesQuery.eq.mockResolvedValue({ count: 0, error: null });

    const invitationsQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      gt: jest.fn(),
    };
    invitationsQuery.select.mockReturnValue(invitationsQuery);
    invitationsQuery.eq.mockReturnValue(invitationsQuery);
    invitationsQuery.is.mockReturnValue(invitationsQuery);
    invitationsQuery.gt.mockResolvedValue({ count: 1, error: null });

    const from = jest.fn((table: string) => {
      if (table === 'profiles') return profilesQuery;
      if (table === 'user_invitations') return invitationsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    jest.mocked(createServiceClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await DELETE(request('DELETE'), context);

    expect(response.status).toBe(409);
    expect(from).not.toHaveBeenCalledWith('custom_roles');
  });

  it.each([
    [
      'role update',
      (req: NextRequest, invalidContext: typeof context) => PUT(req, invalidContext),
      'PUT' as const,
    ],
    [
      'role deletion',
      (req: NextRequest, invalidContext: typeof context) => DELETE(req, invalidContext),
      'DELETE' as const,
    ],
  ])(
    'rejects an invalid code for %s before accessing the database',
    async (_name, handler, method) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'admin-1' },
        role: 'super_admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);
      const invalidContext = { params: Promise.resolve({ code: '../owner' }) };

      const response = await handler(request(method), invalidContext);

      expect(response.status).toBe(400);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );

  it.each([{ name: 42 }, { name: '   ' }, { description: 'x'.repeat(501) }, { color: null }])(
    'rejects invalid role update metadata: %p',
    async (body) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'admin-1' },
        role: 'super_admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await PUT(request('PUT', body), context);

      expect(response.status).toBe(400);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );
});

describe('admin role collection authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['role list', GET_ROLES, 'GET' as const],
    ['role creation', POST_ROLE, 'POST' as const],
  ])('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'permissions.manage');
  });

  it.each([
    ['role list', GET_ROLES, 'GET' as const],
    ['role creation', POST_ROLE, 'POST' as const],
  ])('returns 403 for %s without permissions.manage', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
  });

  it.each(['admin', 'permission_manager'])(
    'prevents %s from creating roles despite a dynamic permissions.manage grant',
    async (actorRole) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'manager-1' },
        role: actorRole,
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await POST_ROLE(
        request('POST', { code: 'new_role', name: 'Vai trò mới', permissions: [] })
      );

      expect(response.status).toBe(403);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );

  it.each(['!!!', `a${'b'.repeat(50)}`])(
    'rejects invalid normalized custom role code %s before accessing the database',
    async (code) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'admin-1' },
        role: 'super_admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await POST_ROLE(request('POST', { code, name: 'Vai trò thử nghiệm' }));

      expect(response.status).toBe(400);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );

  it.each([
    { code: 'office_staff', name: 42 },
    { code: 'office_staff', name: 'x'.repeat(101) },
    { code: 'office_staff', name: 'Nhân viên', description: 42 },
    { code: 'office_staff', name: 'Nhân viên', color: '   ' },
  ])('rejects invalid role creation metadata: %p', async (body) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'super_admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST_ROLE(request('POST', body));

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
