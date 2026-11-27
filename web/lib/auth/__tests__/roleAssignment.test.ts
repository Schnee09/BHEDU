import type { SupabaseClient } from '@supabase/supabase-js';
import { assertAssignableCustomRole, canAssignUserRoleByHierarchy } from '../roleAssignment';
import { resolveServerPermission } from '../permissionResolver';

jest.mock('../permissionResolver', () => ({ resolveServerPermission: jest.fn() }));

function clientWithRolePermissions(permissionCodes: string[]) {
  const roleQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };
  roleQuery.select.mockReturnValue(roleQuery);
  roleQuery.eq.mockReturnValue(roleQuery);
  roleQuery.maybeSingle.mockResolvedValue({ data: { code: 'finance_staff' }, error: null });

  const permissionQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    then: (resolve: (value: unknown) => unknown) =>
      resolve({
        data: permissionCodes.map((permission_code) => ({
          permission_code,
          is_denied: false,
        })),
        error: null,
      }),
  };
  permissionQuery.select.mockReturnValue(permissionQuery);
  permissionQuery.eq.mockReturnValue(permissionQuery);

  return {
    from: jest.fn((table: string) => (table === 'custom_roles' ? roleQuery : permissionQuery)),
  } as unknown as SupabaseClient;
}

describe('custom role assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enforces the system role assignment hierarchy', () => {
    expect(canAssignUserRoleByHierarchy('super_admin', 'owner')).toBe(true);
    expect(canAssignUserRoleByHierarchy('owner', 'admin')).toBe(true);
    expect(canAssignUserRoleByHierarchy('owner', 'owner')).toBe(false);
    expect(canAssignUserRoleByHierarchy('admin', 'teacher')).toBe(true);
    expect(canAssignUserRoleByHierarchy('admin', 'admin')).toBe(false);
    expect(canAssignUserRoleByHierarchy('permission_manager', 'student')).toBe(false);
  });

  it('allows system roles without database lookups', async () => {
    const serviceClient = { from: jest.fn() } as unknown as SupabaseClient;

    await expect(
      assertAssignableCustomRole({
        serviceClient,
        actorId: 'admin-1',
        actorRole: 'admin',
        requestedRole: 'teacher',
      })
    ).resolves.toBeUndefined();

    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  it('prevents a custom operational role from assigning custom roles', async () => {
    const serviceClient = { from: jest.fn() } as unknown as SupabaseClient;

    await expect(
      assertAssignableCustomRole({
        serviceClient,
        actorId: 'staff-1',
        actorRole: 'permission_manager',
        requestedRole: 'finance_staff',
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  it('prevents an admin from assigning a custom role with a permission they lack', async () => {
    const serviceClient = clientWithRolePermissions(['finance.manage']);
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    await expect(
      assertAssignableCustomRole({
        serviceClient,
        actorId: 'admin-1',
        actorRole: 'admin',
        requestedRole: 'finance_staff',
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(resolveServerPermission).toHaveBeenCalledWith('admin-1', 'admin', 'finance.manage');
  });

  it('allows an admin to assign a custom role whose permissions they possess', async () => {
    const serviceClient = clientWithRolePermissions(['students.view']);
    jest.mocked(resolveServerPermission).mockResolvedValue(true);

    await expect(
      assertAssignableCustomRole({
        serviceClient,
        actorId: 'admin-1',
        actorRole: 'admin',
        requestedRole: 'finance_staff',
      })
    ).resolves.toBeUndefined();
  });
});
