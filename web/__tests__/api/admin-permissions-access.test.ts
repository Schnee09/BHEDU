/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/permissions/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

function request() {
  return new NextRequest('http://localhost/api/admin/permissions');
}

describe('GET /api/admin/permissions authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires permissions.manage through the database-aware guard', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
      reason: "Forbidden: missing permission 'permissions.manage'",
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'permissions.manage');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('allows a non-admin role granted permissions.manage dynamically', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      isCustomOverride: true,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const definitionsQuery = {
      select: jest.fn(),
      order: jest.fn(),
    };
    definitionsQuery.select.mockReturnValue(definitionsQuery);
    definitionsQuery.order.mockReturnValueOnce(definitionsQuery).mockResolvedValueOnce({
      data: [{ code: 'students.view', category: 'students' }],
      error: null,
    });
    const rolePermissionsQuery = {
      select: jest.fn().mockResolvedValue({
        data: [{ role: 'staff', permission_code: 'students.view' }],
      }),
    };
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn((table: string) =>
        table === 'permission_definitions' ? definitionsQuery : rolePermissionsQuery
      ),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await GET(request());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.definitions).toEqual([{ code: 'students.view', category: 'students' }]);
    expect(json.rolePermissions).toHaveLength(1);
  });
});
