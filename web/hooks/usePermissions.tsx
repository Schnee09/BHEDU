/**
 * usePermissions Hook
 * Provides permission checking utilities for React components
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import { getFlattenedPermissions, hasPermission, isAtLeast } from '@/lib/auth/core';
import type { UserRole, PermissionCode } from '@/lib/auth/core';

// ============================================
// TYPES
// ============================================

export interface UserPermissionData {
  code: PermissionCode;
  source: 'role' | 'custom' | 'admin';
}

export interface PermissionsState {
  permissions: Set<PermissionCode>;
  loading: boolean;
  error: string | null;
}

// ============================================
// HOOK
// ============================================

interface RoleOverrideRow {
  permission_code: string;
  is_denied: boolean;
}

interface PermissionRow {
  permission_code: string;
  is_denied: boolean;
  expires_at: string | null;
}

export function usePermissions() {
  const { profile, loading: profileLoading } = useProfile();
  const profileId = profile?.id;
  const role = profile?.role as UserRole | undefined;
  const [customPermissions, setCustomPermissions] = useState<Set<PermissionCode>>(new Set());
  const [deniedPermissions, setDeniedPermissions] = useState<Set<PermissionCode>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom permissions (user-level overrides) + role-level DB overrides
  useEffect(() => {
    async function fetchPermissions() {
      if (!profileId) {
        setLoading(false);
        return;
      }

      // super_admin has everything — no DB fetch needed
      if (role === 'super_admin') {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Parallel: user overrides + role overrides
        const [userRes, roleRes] = await Promise.all([
          supabase
            .from('user_permissions')
            .select('permission_code, is_denied, expires_at')
            .eq('user_id', profileId),
          supabase
            .from('role_permission_overrides')
            .select('permission_code, is_denied')
            .eq('role', role),
        ]);

        const now = new Date();
        const granted = new Set<PermissionCode>();
        const denied = new Set<PermissionCode>();

        // ── Layer 2: Role-level DB overrides ──
        const roleRows = (roleRes.data || []) as RoleOverrideRow[];
        for (const row of roleRows) {
          const code = row.permission_code as PermissionCode;
          if (row.is_denied) {
            denied.add(code);
          } else {
            granted.add(code);
          }
        }

        // ── Layer 1: User-level overrides (highest priority — can override role overrides) ──
        const userRows = (userRes.data || []) as unknown as PermissionRow[];
        const validUserRows = userRows.filter((p) => !p.expires_at || new Date(p.expires_at) > now);

        for (const row of validUserRows) {
          const code = row.permission_code as PermissionCode;
          if (row.is_denied) {
            denied.add(code);
            granted.delete(code);
          } else {
            granted.add(code);
            denied.delete(code);
          }
        }

        setCustomPermissions(granted);
        setDeniedPermissions(denied);
        setError(null);
      } catch (err) {
        console.warn('[usePermissions] Error fetching custom permissions:', err);
        setError('Không thể tải quyền tùy chỉnh. Hệ thống đang sử dụng quyền mặc định.');
      } finally {
        setLoading(false);
      }
    }

    if (!profileLoading) {
      fetchPermissions();
    }
  }, [profileId, role, profileLoading]);

  // Compute all permissions (code defaults + role DB overrides + user DB overrides)
  const allPermissions = useMemo(() => {
    if (!role) return new Set<PermissionCode>();

    const permissions = getFlattenedPermissions(role);

    // Apply role-level grants from DB
    customPermissions.forEach((p) => permissions.add(p));

    // Apply denials (from both role and user overrides)
    deniedPermissions.forEach((p) => permissions.delete(p));

    return permissions;
  }, [role, customPermissions, deniedPermissions]);

  // Permission check functions — denial takes priority over grant
  const can = useCallback(
    (permission: PermissionCode): boolean => {
      if (!role) return false;
      if (role === 'super_admin') return true;
      // Denials override everything
      if (deniedPermissions.has(permission)) return false;
      // User-level or role-level custom grants
      if (customPermissions.has(permission)) return true;
      // Fallback to code defaults (BASE_ROLE_PERMISSIONS + inheritance)
      return hasPermission(role, permission);
    },
    [role, customPermissions, deniedPermissions]
  );

  const canAny = useCallback(
    (permissions: PermissionCode[]): boolean => {
      return permissions.some((p) => can(p));
    },
    [can]
  );

  const canAll = useCallback(
    (permissions: PermissionCode[]): boolean => {
      return permissions.every((p) => can(p));
    },
    [can]
  );

  // ── Role checks (inheritance-aware) ──
  // NOTE: Owner is now STANDALONE — isAtLeast(owner, admin) returns false.
  // Use isOwner or isStaff (which includes owner) for owner-specific gates.
  const isAdmin = role ? isAtLeast(role, 'admin') : false;
  // isStaff = any privileged operational role (admin or above, OR owner)
  const isStaff = role ? isAtLeast(role, 'admin') || role === 'owner' : false;
  const isOwner = role === 'owner' || role === 'super_admin';
  const isTeacher = role ? isAtLeast(role, 'teacher') : false;
  const isStudent = role === 'student';
  const isParent = role === 'parent';

  // Exact role checks (identity-based, not inherited)
  const isExactAdmin = role === 'admin' || role === 'super_admin' || role === 'owner';
  const isExactTeacher = role === 'teacher';
  const isExactStudent = role === 'student';
  const isExactParent = role === 'parent';
  const hasTeacherCapabilities = role ? isAtLeast(role, 'teacher') : false;

  return {
    // State
    permissions: allPermissions,
    loading: profileLoading || loading,
    error,
    role: role || null,

    // Permission checks
    can,
    canAny,
    canAll,

    // Role checks
    isAdmin,
    isOwner,
    isStaff,
    isTeacher,
    isStudent,
    isParent,
    hasTeacherCapabilities,

    // Identity checks (Exact role)
    isExactAdmin,
    isExactTeacher,
    isExactStudent,
    isExactParent,

    // Utilities
    hasCustomPermission: (code: PermissionCode) => customPermissions.has(code),
  };
}

// ============================================
// PERMISSION GUARD COMPONENT
// ============================================

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: PermissionCode | PermissionCode[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Guard component that only renders children if user has required permissions
 */
export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
  showLoading = false,
}: PermissionGuardProps) {
  const { can, canAny, canAll, loading } = usePermissions();

  if (loading && showLoading) {
    return <div className="animate-pulse bg-muted h-8 rounded" />;
  }

  if (loading) {
    return null;
  }

  // No permissions required
  if (!permissions) {
    return <>{children}</>;
  }

  // Single permission
  if (typeof permissions === 'string') {
    return can(permissions) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions
  if (requireAll) {
    return canAll(permissions) ? <>{children}</> : <>{fallback}</>;
  } else {
    return canAny(permissions) ? <>{children}</> : <>{fallback}</>;
  }
}

// ============================================
// HIGHER ORDER COMPONENT
// ============================================

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: PermissionCode | PermissionCode[],
  requireAll = false
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard
        permissions={requiredPermissions}
        requireAll={requireAll}
        fallback={
          <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
            Bạn không có quyền truy cập nội dung này
          </div>
        }
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}
