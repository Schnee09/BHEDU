import { SYSTEM_PERMISSION_DEFINITIONS, type UserRole } from './core';

const VALID_PERMISSION_CODES = new Set(
  SYSTEM_PERMISSION_DEFINITIONS.map((permission) => permission.code)
);

export function isValidPermissionCode(code: string): boolean {
  return VALID_PERMISSION_CODES.has(code as never);
}

export function canManageUserPermissions(input: {
  actorId: string;
  actorRole: UserRole;
  targetId: string;
  targetRole: UserRole;
}): boolean {
  if (input.actorId === input.targetId) return false;
  if (input.actorRole === 'super_admin') return true;
  if (input.actorRole === 'owner') {
    return input.targetRole !== 'super_admin' && input.targetRole !== 'owner';
  }
  if (input.actorRole === 'admin') {
    return !['super_admin', 'owner', 'admin'].includes(input.targetRole);
  }
  return false;
}

export function canManageRolePermissions(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === 'super_admin') return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'owner') return targetRole !== 'owner';
  return false;
}
