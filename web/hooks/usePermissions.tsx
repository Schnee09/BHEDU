/**
 * usePermissions Hook
 * Provides permission checking utilities for React components
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import type { PermissionCode, UserRole } from '@/lib/auth/permissions.config';
import {
  ROLE_PERMISSIONS,
  roleHasPermission,
  canAccessRoute,
  PERMISSIONS
} from '@/lib/auth/permissions.config';

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

export function usePermissions() {
  const { profile, loading: profileLoading } = useProfile();
  const [customPermissions, setCustomPermissions] = useState<Set<PermissionCode>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom permissions from database
  useEffect(() => {
    async function fetchCustomPermissions() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      // Admin has all permissions, no need to fetch
      if (profile.role === 'admin') {
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
          // Table might not exist or RLS blocking - this is OK, just use role defaults
          // Don't show error to user, just log it
          console.warn('[usePermissions] Could not fetch custom permissions (table may not exist):', fetchError.code);
          // Don't set error - gracefully degrade to role-based permissions only
        } else {
          const now = new Date();
          const validPermissions = (data || [])
            .filter(p =>
              !p.is_denied &&
              (!p.expires_at || new Date(p.expires_at) > now)
            )
            .map(p => p.permission_code as PermissionCode);

          setCustomPermissions(new Set(validPermissions));
        }
      } catch (err) {
        // Silently fail - use role-based permissions only
        console.warn('[usePermissions] Error fetching custom permissions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!profileLoading) {
      fetchCustomPermissions();
    }
  }, [profile?.id, profile?.role, profileLoading]);

  // Compute all permissions (role defaults + custom)
  const allPermissions = useMemo(() => {
    if (!profile?.role) return new Set<PermissionCode>();

    const role = profile.role as UserRole;
    const rolePerms = new Set<PermissionCode>(ROLE_PERMISSIONS[role] || []);

    // Merge with custom permissions
    customPermissions.forEach(p => rolePerms.add(p));

    return rolePerms;
  }, [profile?.role, customPermissions]);

  // Permission check functions
  const can = useCallback((permission: PermissionCode): boolean => {
    if (!profile?.role) return false;
    if (profile.role === 'admin') return true;
    return allPermissions.has(permission);
  }, [profile?.role, allPermissions]);

  const canAny = useCallback((permissions: PermissionCode[]): boolean => {
    return permissions.some(p => can(p));
  }, [can]);

  const canAll = useCallback((permissions: PermissionCode[]): boolean => {
    return permissions.every(p => can(p));
  }, [can]);

  const canAccessPath = useCallback((path: string): boolean => {
    return canAccessRoute(allPermissions, path);
  }, [allPermissions]);

  // Role checks
  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff' || isAdmin;
  const isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student';

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
    canAccessPath,

    // Role checks
    isAdmin,
    isStaff,
    isTeacher,
    isStudent,

    // Utilities
    getPermissionInfo: (code: PermissionCode) => PERMISSIONS[code],
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
