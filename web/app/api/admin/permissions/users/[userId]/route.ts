/**
 * User Permissions API
 * Grant, revoke, and manage permissions for specific users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/permissions/users/[userId] - Get user's permissions
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const supabase = createClientFromRequest(request);
    
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get target user's profile
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's custom permissions
    const { data: customPerms } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    // Get role default permissions
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_code')
      .eq('role', targetUser.role);

    return NextResponse.json({
      user: targetUser,
      rolePermissions: rolePerms?.map(p => p.permission_code) || [],
      customPermissions: customPerms || [],
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/admin/permissions/users/[userId] - Grant permission to user
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const body = await request.json();
    const { permission_code, expires_at, notes } = body;

    if (!permission_code) {
      return NextResponse.json({ error: 'permission_code is required' }, { status: 400 });
    }

    const supabase = createClientFromRequest(request);
    
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Grant permission
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permission_code,
        granted_by: adminProfile.id,
        expires_at: expires_at || null,
        is_denied: false,
        notes,
      }, {
        onConflict: 'user_id,permission_code',
      })
      .select()
      .single();

    if (error) {
      console.error('Grant permission error:', error);
      return NextResponse.json({ error: 'Failed to grant permission' }, { status: 500 });
    }

    // Log to audit
    await supabase.from('permission_audit_logs').insert({
      action: 'grant',
      user_id: userId,
      permission_code,
      performed_by: adminProfile.id,
      new_value: { expires_at, notes },
      reason: notes,
    });

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

    if (!permission_code) {
      return NextResponse.json({ error: 'permission_code is required' }, { status: 400 });
    }

    const supabase = createClientFromRequest(request);
    
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get old value for audit
    const { data: oldPerm } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('permission_code', permission_code)
      .single();

    // Delete permission
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission_code', permission_code);

    if (error) {
      console.error('Revoke permission error:', error);
      return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 });
    }

    // Log to audit
    await supabase.from('permission_audit_logs').insert({
      action: 'revoke',
      user_id: userId,
      permission_code,
      performed_by: adminProfile.id,
      old_value: oldPerm,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
