/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/permissions/users/[userId]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const context = { params: Promise.resolve({ userId: 'target-user' }) };

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/permissions/users/target-user', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('user permission grant validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
      user: { id: 'auth-admin-1' },
    } as Awaited<ReturnType<typeof getAuthContext>>);
  });

  it.each([
    null,
    [],
    { permission_code: 'students.view', notes: 42 },
    { permission_code: 'students.view', notes: 'x'.repeat(501) },
    { permission_code: 'students.view', expires_at: 42 },
    { permission_code: 'students.view', expires_at: 'not-a-date' },
  ])('rejects invalid grant payload %p before accessing the database', async (body) => {
    const response = await POST(request(body), context);

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('prevents an administrator from granting a permission they do not have', async () => {
    const profileQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn(),
    };
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.eq.mockReturnValue(profileQuery);
    profileQuery.maybeSingle.mockResolvedValue({
      data: { id: 'target-user', role: 'teacher' },
      error: null,
    });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn().mockReturnValue(profileQuery),
    } as unknown as ReturnType<typeof createServiceClient>);
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await POST(request({ permission_code: 'system.settings' }), context);

    expect(response.status).toBe(403);
    expect(resolveServerPermission).toHaveBeenCalledWith('admin-1', 'admin', 'system.settings');
  });
});
