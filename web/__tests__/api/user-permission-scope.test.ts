/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_USER } from '@/app/api/admin/permissions/users/[userId]/route';
import { GET as GET_USERS } from '@/app/api/admin/permissions/users/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

describe('user permission management scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not list users for a custom role even with permissions.manage', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1' },
      role: 'permission_manager',
      user: { id: 'auth-staff-1' },
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET_USERS(
      new NextRequest('http://localhost/api/admin/permissions/users')
    );

    expect(response.status).toBe(403);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('returns an empty page when an admin filters for a protected role', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
      user: { id: 'auth-admin-1' },
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET_USERS(
      new NextRequest('http://localhost/api/admin/permissions/users?role=owner')
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.users).toEqual([]);
    expect(json.pagination.total).toBe(0);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('prevents an admin from reading a protected user permission profile', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
      user: { id: 'auth-admin-1' },
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const profileQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    };
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.eq.mockReturnValue(profileQuery);
    profileQuery.single.mockResolvedValue({
      data: { id: 'owner-1', role: 'owner', email: 'owner@example.com' },
      error: null,
    });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn().mockReturnValue(profileQuery),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await GET_USER(
      new NextRequest('http://localhost/api/admin/permissions/users/owner-1'),
      { params: Promise.resolve({ userId: 'owner-1' }) }
    );

    expect(response.status).toBe(403);
    expect(createServiceClient).toHaveBeenCalledTimes(1);
  });
});
