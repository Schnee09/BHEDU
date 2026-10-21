/**
 * User Permissions API
 * Grant, revoke, and manage permissions for specific users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { canManageUserPermissions, isValidPermissionCode } from '@/lib/auth/permissionManagement';
import type { UserRole } from '@/lib/auth/core';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/permissions/users/[userId] - Get user's permissions
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const auth = await getAuthContext(request, 'permissions.manage');
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.user ? 403 : 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Get target user's profile
    const { data: targetUser, error: targetError } = await serviceClient
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', userId)
      .single();

    if (targetError) {
      console.error('[Permissions API] Target user fetch error:', targetError);
      return NextResponse.json(
        {
          error: 'User fetch error',
          details: targetError.message,
        },
        { status: 500 }
      );
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's custom permissions - handle missing table gracefully
    let customPerms: any[] = [];
    try {
      const { data, error } = await serviceClient
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('[Permissions API] user_permissions query error:', error.message, error.code);
      } else {
        customPerms = data || [];
      }
    } catch (e) {
      console.warn('[Permissions API] user_permissions not available');
    }

    // Get role default permissions - handle missing table gracefully
    let rolePerms: string[] = [];
    try {
      const { data, error } = await serviceClient
        .from('role_permissions')
        .select('permission_code')
        .eq('role', targetUser.role);

      if (error) {
        console.warn('[Permissions API] role_permissions query error:', error.message, error.code);
      } else {
        rolePerms = data?.map((p) => p.permission_code) || [];
      }
    } catch (e) {
      console.warn('[Permissions API] role_permissions not available');
    }

    console.log(
      '[Permissions API] Success - rolePerms:',
      rolePerms.length,
      'customPerms:',
      customPerms.length
    );

    return NextResponse.json({
      user: targetUser,
      rolePermissions: rolePerms,
      customPermissions: customPerms,
    });
  } catch (error) {
    console.error('[Permissions API] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions/users/[userId] - Grant permission to user
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

    const body = await request.json();
    const { permission_code, expires_at, notes } = body;

    if (typeof permission_code !== 'string' || !isValidPermissionCode(permission_code)) {
      return NextResponse.json(
        { error: 'Invalid permission_code' },
        {
          status: 400,
        }
      );
    }

    const auth = await getAuthContext(request, 'permissions.manage');
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.user ? 403 : 401 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: targetUser } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (
      !canManageUserPermissions({
        actorId: auth.profile.id,
        actorRole: auth.role,
        targetId: targetUser.id,
        targetRole: targetUser.role as UserRole,
      })
    ) {
      return NextResponse.json(
        { error: 'Cannot manage permissions for this user' },
        { status: 403 }
      );
    }

    // Grant permission
    const { data, error } = await serviceClient
      .from('user_permissions')
      .upsert(
        {
          user_id: userId,
          permission_code,
          granted_by: auth.profile.id,
          expires_at: expires_at || null,
          is_denied: false,
          notes,
        },
        {
          onConflict: 'user_id,permission_code',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Permissions API] Grant permission error:', error);
      return NextResponse.json(
        {
          error: 'Failed to grant permission',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Log to audit (don't fail if this errors)
    try {
      await serviceClient.from('permission_audit_logs').insert({
        action: 'grant',
        user_id: userId,
        permission_code,
        performed_by: auth.profile.id,
        new_value: { expires_at, notes },
        reason: notes,
      });
    } catch (auditError) {
      console.warn('[Permissions API] Audit log error (non-fatal):', auditError);
    }

    return NextResponse.json({ success: true, permission: data });
  } catch (error) {
    console.error('Grant permission error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/admin/permissions/users/[userId] - Revoke permission from user
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const permission_code = searchParams.get('permission_code');

    if (!permission_code || !isValidPermissionCode(permission_code)) {
      return NextResponse.json(
        { error: 'Invalid permission_code' },
        {
          status: 400,
        }
      );
    }

    const auth = await getAuthContext(request, 'permissions.manage');
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.user ? 403 : 401 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: targetUser } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (
      !canManageUserPermissions({
        actorId: auth.profile.id,
        actorRole: auth.role,
        targetId: targetUser.id,
        targetRole: targetUser.role as UserRole,
      })
    ) {
      return NextResponse.json(
        { error: 'Cannot manage permissions for this user' },
        { status: 403 }
      );
    }

    // Get old value for audit
    const { data: oldPerm } = await serviceClient
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('permission_code', permission_code)
      .single();

    // Delete permission
    const { error } = await serviceClient
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission_code', permission_code);

    if (error) {
      console.error('Revoke permission error:', error);
      return NextResponse.json(
        {
          error: 'Failed to revoke permission',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Log to audit
    try {
      await serviceClient.from('permission_audit_logs').insert({
        action: 'revoke',
        user_id: userId,
        permission_code,
        performed_by: auth.profile.id,
        old_value: oldPerm,
      });
    } catch (auditError) {
      console.warn('[Permissions API] Audit log error (non-fatal):', auditError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
