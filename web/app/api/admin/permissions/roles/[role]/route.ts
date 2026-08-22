/**
 * Role Permission Overrides API
 * Allows Super Admin to add/remove permissions from role defaults
 *
 * GET  /api/admin/permissions/roles/[role]  — Get current overrides for a role
 * POST /api/admin/permissions/roles/[role]  — Upsert an override (grant or deny)
 * DELETE /api/admin/permissions/roles/[role]?permission_code=x — Remove an override
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { UserRole, BASE_ROLE_PERMISSIONS, SYSTEM_PERMISSION_DEFINITIONS } from '@/lib/auth/core';

interface RouteContext {
  params: Promise<{ role: string }>;
}

const VALID_ROLES: UserRole[] = ['owner', 'admin', 'teacher', 'tutor', 'parent', 'student'];

async function getSuperAdminProfile(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .or(`id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (profile?.role !== 'super_admin' && profile?.role !== 'owner') return null;
  return profile;
}

// GET — Get current overrides for a role
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { role } = await context.params;

    const supabase = createClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    if (!['super_admin', 'owner', 'admin'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    const { data: overrides, error: overridesError } = await serviceClient
      .from('role_permission_overrides')
      .select('*')
      .eq('role', role)
      .order('permission_code');

    if (overridesError) {
      console.error('[Role Perms API] Failed to fetch overrides:', overridesError);
      return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
    }

    // Also return the base role_permissions (code defaults with fallback)
    let basePermissions: string[] = [];
    if (role === 'super_admin') {
      basePermissions = SYSTEM_PERMISSION_DEFINITIONS.map((p) => p.code);
    } else {
      const { data: basePerms } = await serviceClient
        .from('role_permissions')
        .select('permission_code')
        .eq('role', role);

      if (basePerms && basePerms.length > 0) {
        basePermissions = basePerms.map((p) => p.permission_code);
      } else {
        basePermissions = (BASE_ROLE_PERMISSIONS[role as UserRole] || []).map((p) => String(p));
      }
    }

    return NextResponse.json({
      role,
      overrides: overrides || [],
      basePermissions,
    });
  } catch (err) {
    console.error('[Role Perms API] GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST — Upsert a role permission override
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { role } = await context.params;

    if (!role || !/^[a-z0-9_-]+$/i.test(role)) {
      return NextResponse.json({ error: 'Invalid role code format' }, { status: 400 });
    }

    const adminProfile = await getSuperAdminProfile(request);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { permission_code, is_denied = false, notes } = body;

    if (!permission_code) {
      return NextResponse.json({ error: 'permission_code is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Get old value for audit
    const { data: oldOverride } = await serviceClient
      .from('role_permission_overrides')
      .select('*')
      .eq('role', role)
      .eq('permission_code', permission_code)
      .maybeSingle();

    // Upsert override
    const { data, error } = await serviceClient
      .from('role_permission_overrides')
      .upsert(
        {
          role,
          permission_code,
          is_denied,
          granted_by: adminProfile.id,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'role,permission_code' }
      )
      .select()
      .single();

    if (error) {
      console.error('[Role Perms API] Upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to save override', details: error.message },
        { status: 500 }
      );
    }

    // Audit log
    await serviceClient.from('permission_audit_logs').insert({
      action: is_denied ? 'deny' : 'grant',
      user_id: adminProfile.id, // role change: user_id = performer for role-level entries
      permission_code,
      performed_by: adminProfile.id,
      old_value: oldOverride || null,
      new_value: { role, is_denied, notes },
      reason: notes || null,
      scope: 'role',
    });

    return NextResponse.json({ success: true, override: data });
  } catch (err) {
    console.error('[Role Perms API] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE — Remove a role permission override (reverts to code default)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { role } = await context.params;
    const { searchParams } = new URL(request.url);
    const permission_code = searchParams.get('permission_code');

    if (!permission_code) {
      return NextResponse.json({ error: 'permission_code is required' }, { status: 400 });
    }

    const adminProfile = await getSuperAdminProfile(request);
    if (!adminProfile) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Get old value for audit
    const { data: oldOverride } = await serviceClient
      .from('role_permission_overrides')
      .select('*')
      .eq('role', role)
      .eq('permission_code', permission_code)
      .maybeSingle();

    const { error } = await serviceClient
      .from('role_permission_overrides')
      .delete()
      .eq('role', role)
      .eq('permission_code', permission_code);

    if (error) {
      console.error('[Role Perms API] Delete error:', error);
      return NextResponse.json({ error: 'Failed to remove override' }, { status: 500 });
    }

    // Audit log
    await serviceClient.from('permission_audit_logs').insert({
      action: 'revoke',
      user_id: adminProfile.id,
      permission_code,
      performed_by: adminProfile.id,
      old_value: oldOverride || null,
      new_value: null,
      reason: 'Override removed — reverted to code default',
      scope: 'role',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Role Perms API] DELETE error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
