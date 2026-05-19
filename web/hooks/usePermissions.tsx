/**
 * usePermissions Hook
 * Provides permission checking utilities for React components
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import {
  getFlattenedPermissions,
  hasPermission,
  isAtLeast,
  UserRole,
  PermissionCode,
} from '@/lib/auth/core';

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

interface PermissionRow {
  permission_code: string;
  is_denied: boolean;
  expires_at: string | null;
}

export function usePermissions() {
  const { profile, loading: profileLoading } = useProfile();
  const [customPermissions, setCustomPermissions] = useState<Set<PermissionCode>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom permissions from database (optional feature)
  useEffect(() => {
    async function fetchCustomPermissions() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      // Optimization: super_admin doesn't need to fetch custom perms (it has everything)
      if (profile.role === 'super_admin') {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('user_permissions')
          .select('permission_code, is_denied, expires_at')
          .eq('user_id', profile.id);

        if (fetchError) {
          console.warn(
            '[usePermissions] Table user_permissions missing or inaccessible.',
            fetchError
          );
        } else {
          console.log('[usePermissions] Raw user_permissions data from DB:', data);
          const now = new Date();
          const rows = (data || []) as unknown as PermissionRow[];

          const validPermissions = rows
            .filter((p) => !p.is_denied && (!p.expires_at || new Date(p.expires_at) > now))
            .map((p) => p.permission_code as PermissionCode);

          console.log('[usePermissions] Validated custom permissions:', validPermissions);
          setCustomPermissions(new Set(validPermissions));
        }
      } catch (err) {
        console.warn('[usePermissions] Error fetching custom permissions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!profileLoading) {
      fetchCustomPermissions();
    }
  }, [profile?.id, profile?.role, profileLoading]);

  // Compute all permissions (role inheritance + custom)
  const allPermissions = useMemo(() => {
    if (!profile?.role) return new Set<PermissionCode>();

    const role = profile.role as UserRole;
    const permissions = getFlattenedPermissions(role);

    // Merge with custom permissions
    customPermissions.forEach((p) => permissions.add(p));

    console.log('[usePermissions] Computed permissions list:', Array.from(permissions));
    return permissions;
  }, [profile?.role, customPermissions]);

  // Permission check functions
  const can = useCallback(
    (permission: PermissionCode): boolean => {
      if (!profile?.role) return false;
      // Check custom permissions first
      if (customPermissions.has(permission)) return true;
      // Fallback to core RBAC logic (includes inheritance)
      return hasPermission(profile.role as UserRole, permission);
    },
    [profile?.role, customPermissions]
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

  // Role checks using inheritance logic
  const isAdmin = useMemo(
    () => (profile ? isAtLeast(profile.role as UserRole, 'admin') : false),
    [profile]
  );
  const isStaff = useMemo(
    () => (profile ? isAtLeast(profile.role as UserRole, 'staff') : false),
    [profile]
  );
  const isTeacher = useMemo(
    () => (profile ? isAtLeast(profile.role as UserRole, 'teacher') : false),
    [profile]
  );
  const isStudent = useMemo(
    () => (profile ? isAtLeast(profile.role as UserRole, 'student') : false),
    [profile]
  );
  const isParent = useMemo(
    () => (profile ? isAtLeast(profile.role as UserRole, 'parent') : false),
    [profile]
  );

  // Exact role checks (Identity-based, not inherited)
  const isExactAdmin = useMemo(
    () => profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner',
    [profile]
  );
  const isExactTeacher = useMemo(() => profile?.role === 'teacher', [profile]);
  const isExactStudent = useMemo(() => profile?.role === 'student', [profile]);
  const isExactParent = useMemo(() => profile?.role === 'parent', [profile]);

  // Capability convenience check
  const hasTeacherCapabilities = useMemo(() => {
    if (!profile) return false;
    return isAtLeast(profile.role as UserRole, 'teacher');
  }, [profile]);

  return {
    // State
    permissions: allPermissions,
    loading: profileLoading || loading,
    error,
    role: (profile?.role || null) as UserRole | null,

    // Permission checks
    can,
    canAny,
    canAll,

    // Role checks (Inheritance-aware)
    isAdmin,
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
