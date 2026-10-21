import {
  canManageRolePermissions,
  canManageUserPermissions,
  isValidPermissionCode,
} from '../permissionManagement';

describe('permission management safety', () => {
  it('rejects unknown permission codes', () => {
    expect(isValidPermissionCode('permissions.manage')).toBe(true);
    expect(isValidPermissionCode('system.made_up')).toBe(false);
  });

  it('prevents managers from changing their own permissions', () => {
    expect(
      canManageUserPermissions({
        actorId: 'admin-1',
        actorRole: 'admin',
        targetId: 'admin-1',
        targetRole: 'admin',
      })
    ).toBe(false);
  });

  it('prevents admin from changing peer or higher privileged accounts', () => {
    for (const targetRole of ['admin', 'owner', 'super_admin'] as const) {
      expect(
        canManageUserPermissions({
          actorId: 'admin-1',
          actorRole: 'admin',
          targetId: `target-${targetRole}`,
          targetRole,
        })
      ).toBe(false);
    }
    expect(
      canManageUserPermissions({
        actorId: 'admin-1',
        actorRole: 'admin',
        targetId: 'teacher-1',
        targetRole: 'teacher',
      })
    ).toBe(true);
  });

  it('lets owner manage lower roles but not owners or super admins', () => {
    expect(
      canManageUserPermissions({
        actorId: 'owner-1',
        actorRole: 'owner',
        targetId: 'admin-1',
        targetRole: 'admin',
      })
    ).toBe(true);
    expect(
      canManageUserPermissions({
        actorId: 'owner-1',
        actorRole: 'owner',
        targetId: 'super-1',
        targetRole: 'super_admin',
      })
    ).toBe(false);
  });

  it('only lets super admin or owner modify eligible role policies', () => {
    expect(canManageRolePermissions('super_admin', 'admin')).toBe(true);
    expect(canManageRolePermissions('super_admin', 'super_admin')).toBe(false);
    expect(canManageRolePermissions('owner', 'teacher')).toBe(true);
    expect(canManageRolePermissions('owner', 'owner')).toBe(false);
    expect(canManageRolePermissions('admin', 'student')).toBe(false);
  });
});
