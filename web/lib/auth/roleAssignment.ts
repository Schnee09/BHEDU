import type { SupabaseClient } from '@supabase/supabase-js';
import type { PermissionCode } from './core';
import { AppError, AuthorizationError, ValidationError } from '@/lib/api/errors';
import { isValidPermissionCode, isValidRoleCode } from './permissionManagement';
import { resolveServerPermission } from './permissionResolver';

export const SYSTEM_USER_ROLE_CODES = new Set([
  'super_admin',
  'owner',
  'admin',
  'staff',
  'teacher',
  'tutor',
  'parent',
  'student',
]);

export async function assertAssignableCustomRole(input: {
  serviceClient: SupabaseClient;
  actorId?: string;
  actorRole: string;
  requestedRole: string;
}) {
  if (SYSTEM_USER_ROLE_CODES.has(input.requestedRole)) return;

  if (!isValidRoleCode(input.requestedRole)) {
    throw new ValidationError('Mã vai trò không hợp lệ');
  }
  if (!['super_admin', 'owner', 'admin'].includes(input.actorRole)) {
    throw new AuthorizationError('Bạn không có quyền gán vai trò tùy chỉnh');
  }

  const { data: customRole, error: roleError } = await input.serviceClient
    .from('custom_roles')
    .select('code')
    .eq('code', input.requestedRole)
    .maybeSingle();

  if (roleError) {
    throw new AppError('Không thể kiểm tra vai trò tùy chỉnh');
  }
  if (!customRole) {
    throw new ValidationError('Vai trò tùy chỉnh không tồn tại');
  }
  if (input.actorRole === 'super_admin') return;
  if (!input.actorId) {
    throw new AuthorizationError('Không xác định được người gán vai trò');
  }

  const { data: overrides, error: overridesError } = await input.serviceClient
    .from('role_permission_overrides')
    .select('permission_code, is_denied')
    .eq('role', input.requestedRole);

  if (overridesError) {
    throw new AppError('Không thể kiểm tra quyền của vai trò tùy chỉnh');
  }

  const grantedPermissions = Array.from(
    new Set(
      (overrides || [])
        .filter(
          (override) =>
            !override.is_denied &&
            typeof override.permission_code === 'string' &&
            isValidPermissionCode(override.permission_code)
        )
        .map((override) => override.permission_code as PermissionCode)
    )
  );
  const delegationChecks = await Promise.all(
    grantedPermissions.map((permission) =>
      resolveServerPermission(input.actorId!, input.actorRole, permission)
    )
  );

  if (delegationChecks.some((allowed) => !allowed)) {
    throw new AuthorizationError('Không thể gán vai trò có quyền cao hơn tài khoản hiện tại');
  }
}
