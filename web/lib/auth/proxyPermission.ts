import { hasPermission, PermissionCode, UserRole } from './core';

interface PermissionRpcClient {
  rpc(
    name: string,
    params: { p_user_id: string; p_permission_code: string }
  ): PromiseLike<{ data: boolean | null; error: unknown }>;
}

/** Resolve navigation permissions with the same database-aware policy as API guards. */
export async function resolveProxyPermission(
  client: PermissionRpcClient,
  profileId: string,
  role: UserRole,
  permission: PermissionCode
): Promise<boolean> {
  if (role === 'super_admin') return true;

  try {
    const { data, error } = await client.rpc('user_has_permission', {
      p_user_id: profileId,
      p_permission_code: permission,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (error) {
    console.warn('[Proxy] Dynamic permission lookup failed:', error);
  }

  return hasPermission(role, permission);
}
