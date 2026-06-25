/**
 * Server-side Authorization Guards
 * Provides unified authentication and permission checking for API routes and Server Actions.
 */

import { NextRequest } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { PermissionCode, UserRole } from './core';
import { resolveServerPermission } from './permissionResolver';

export interface AuthContext {
  user: any | null;
  profile: any | null;
  role: UserRole | null;
  authorized: boolean;
  reason?: string;
  isCustomOverride?: boolean;
}

/**
 * Standardized authentication and authorization context for server-side handlers.
 *
 * @param request - The NextRequest object
 * @param requiredPermission - Optional permission code to check
 * @returns AuthContext containing user, profile, and authorization status
 */
export async function getAuthContext(
  request: Request | NextRequest,
  requiredPermission?: PermissionCode
): Promise<AuthContext> {
  try {
    const supabase = createClientFromRequest(request as NextRequest);

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        user: null,
        profile: null,
        role: null,
        authorized: false,
        reason: 'Unauthorized: login required',
      };
    }

    // 2. Get user profile securely bypassing RLS
    const serviceClient = createServiceClient();

    // Try user_id first
    let { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, role, full_name, email, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fallback to id
    if (!profile && !profileError) {
      const result = await serviceClient
        .from('profiles')
        .select('id, role, full_name, email, is_active')
        .eq('id', user.id)
        .maybeSingle();

      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile) {
      return {
        user,
        profile: null,
        role: null,
        authorized: false,
        reason: 'Unauthorized: profile missing',
      };
    }

    if (!profile.is_active) {
      return {
        user,
        profile,
        role: profile.role as UserRole,
        authorized: false,
        reason: 'Unauthorized: account disabled',
      };
    }

    const role = (profile.role as string).toLowerCase() as UserRole;

    // 3. Permission Check (if requested) — uses 3-layer DB-aware resolver
    if (requiredPermission) {
      // Check if there is a custom user-level database override (not denied, not expired)
      const { data: customGrant } = await serviceClient
        .from('user_permissions')
        .select('id')
        .eq('user_id', profile.id)
        .eq('permission_code', requiredPermission)
        .eq('is_denied', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .maybeSingle();

      const allowed = await resolveServerPermission(profile.id, role, requiredPermission);
      if (!allowed) {
        return {
          user,
          profile,
          role,
          authorized: false,
          reason: `Forbidden: missing permission '${requiredPermission}'`,
        };
      }

      return {
        user,
        profile,
        role,
        authorized: true,
        isCustomOverride: !!customGrant,
      };
    }

    return {
      user,
      profile,
      role,
      authorized: true,
    };
  } catch (error) {
    console.error('[getAuthContext] Internal error:', error);
    return {
      user: null,
      profile: null,
      role: null,
      authorized: false,
      reason: 'Internal Server Error',
    };
  }
}
