/**
 * Server-Side Permission Resolver
 *
 * Implements 3-layer permission resolution using the database:
 *   Layer 1 (highest): User-level overrides (user_permissions table)
 *   Layer 2 (mid):     Role-level DB overrides (role_permission_overrides table)
 *   Layer 3 (base):    Code defaults (BASE_ROLE_PERMISSIONS + ROLE_HIERARCHY)
 *
 * Only used server-side (API routes, Server Actions).
 * Client-side uses usePermissions hook which fetches the same layers.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { getFlattenedPermissions, hasPermission, UserRole, PermissionCode } from './core';

export interface ResolvedPermissions {
  granted: Set<PermissionCode>;
  denied: Set<PermissionCode>;
}

/**
 * Check if a user has a specific permission using 3-layer resolution.
 * Falls back to code-only check if DB is unreachable.
 */
export async function resolveServerPermission(
  userId: string,
  role: UserRole,
  permission: PermissionCode
): Promise<boolean> {
  if (role === 'super_admin') return true;

  try {
    const supabase = createServiceClient();

    // ── Layer 1: User-level overrides ──
    const { data: userPerm } = await supabase
      .from('user_permissions')
      .select('is_denied')
      .eq('user_id', userId)
      .eq('permission_code', permission)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .maybeSingle();

    if (userPerm !== null) {
      return !userPerm.is_denied;
    }

    // ── Layer 2: Role-level DB overrides ──
    const { data: rolePerm } = await supabase
      .from('role_permission_overrides')
      .select('is_denied')
      .eq('role', role)
      .eq('permission_code', permission)
      .maybeSingle();

    if (rolePerm !== null) {
      return !rolePerm.is_denied;
    }
  } catch (err) {
    // DB unavailable — fall back to code defaults
    console.warn('[resolveServerPermission] DB check failed, falling back to code defaults:', err);
  }

  // ── Layer 3: Code defaults ──
  return hasPermission(role, permission);
}

/**
 * Get the full effective permission set for a user.
 * Returns which permissions are granted/denied across all 3 layers.
 */
export async function getEffectivePermissions(
  userId: string,
  role: UserRole
): Promise<ResolvedPermissions> {
  const codeDefaults = getFlattenedPermissions(role);
  const granted = new Set<PermissionCode>(codeDefaults);
  const denied = new Set<PermissionCode>();

  if (role === 'super_admin') {
    granted.add('*');
    return { granted, denied };
  }

  try {
    const supabase = createServiceClient();

    // Fetch role overrides
    const { data: roleOverrides } = await supabase
      .from('role_permission_overrides')
      .select('permission_code, is_denied')
      .eq('role', role);

    for (const override of roleOverrides || []) {
      const code = override.permission_code as PermissionCode;
      if (override.is_denied) {
        denied.add(code);
        granted.delete(code);
      } else {
        granted.add(code);
        denied.delete(code);
      }
    }

    // Fetch user overrides (highest priority — can override role overrides)
    const { data: userOverrides } = await supabase
      .from('user_permissions')
      .select('permission_code, is_denied')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    for (const override of userOverrides || []) {
      const code = override.permission_code as PermissionCode;
      if (override.is_denied) {
        denied.add(code);
        granted.delete(code);
      } else {
        granted.add(code);
        denied.delete(code);
      }
    }
  } catch (err) {
    console.warn('[getEffectivePermissions] DB check failed, using code defaults only:', err);
  }

  return { granted, denied };
}
