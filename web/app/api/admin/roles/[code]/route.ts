/**
 * Custom Role Detail API
 * PUT /api/admin/roles/[code] — Update custom role
 * DELETE /api/admin/roles/[code] — Safely delete custom role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

const SYSTEM_ROLE_CODES = [
  'super_admin',
  'owner',
  'admin',
  'teacher',
  'tutor',
  'parent',
  'student',
];

interface RouteContext {
  params: Promise<{ code: string }>;
}

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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const admin = await getSuperAdminProfile(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, permissions } = body;

    const isSystemRole = SYSTEM_ROLE_CODES.includes(code.toLowerCase());

    const serviceClient = createServiceClient();

    if (!isSystemRole) {
      // 1. Update in custom_roles table
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (color) updateData.color = color;

      const { error: updateError } = await serviceClient
        .from('custom_roles')
        .update(updateData)
        .eq('code', code);

      if (updateError) {
        // Fallback: app_settings
        const { data: existingSettings } = await serviceClient
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'custom_roles')
          .maybeSingle();

        if (existingSettings?.setting_value) {
          const list = Array.isArray(existingSettings.setting_value)
            ? existingSettings.setting_value
            : JSON.parse(existingSettings.setting_value);

          const updatedList = list.map((r: any) =>
            r.code === code ? { ...r, ...updateData } : r
          );

          await serviceClient.from('app_settings').upsert({
            setting_key: 'custom_roles',
            setting_value: updatedList,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 2. If permissions array is provided, sync role_permission_overrides
    if (Array.isArray(permissions)) {
      // Clear existing overrides for this role
      await serviceClient
        .from('role_permission_overrides')
        .delete()
        .eq('role', code);

      if (permissions.length > 0) {
        const overridesToInsert = permissions.map((pCode: string) => ({
          role: code,
          permission_code: pCode,
          is_denied: false,
          granted_by: admin.id,
          notes: `Cập nhật quyền cho vai trò '${name || code}'`,
          updated_at: new Date().toISOString(),
        }));

        await serviceClient
          .from('role_permission_overrides')
          .upsert(overridesToInsert, { onConflict: 'role,permission_code' });
      }
    }

    // 3. Audit log
    await serviceClient.from('permission_audit_logs').insert({
      action: 'grant',
      user_id: admin.id,
      permission_code: '*',
      performed_by: admin.id,
      old_value: null,
      new_value: { role: code, name, description },
      reason: `Cập nhật vai trò '${name || code}'`,
      scope: 'role',
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật vai trò thành công`,
    });
  } catch (error: any) {
    console.error('[Roles Detail API] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const admin = await getSuperAdminProfile(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (SYSTEM_ROLE_CODES.includes(code.toLowerCase())) {
      return NextResponse.json(
        { error: 'Không thể xóa các vai trò hệ thống mặc định' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Safety Check: Check if any user currently has this role
    const { count: usersWithRole, error: countError } = await serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', code);

    if (usersWithRole && usersWithRole > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa vai trò này vì đang có ${usersWithRole} tài khoản sử dụng. Vui lòng chuyển các tài khoản sang vai trò khác trước khi xóa.`,
        },
        { status: 400 }
      );
    }

    // 2. Delete from custom_roles table
    await serviceClient.from('custom_roles').delete().eq('code', code);

    // 3. Fallback: remove from app_settings
    const { data: existingSettings } = await serviceClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'custom_roles')
      .maybeSingle();

    if (existingSettings?.setting_value) {
      const list = Array.isArray(existingSettings.setting_value)
        ? existingSettings.setting_value
        : JSON.parse(existingSettings.setting_value);

      const filtered = list.filter((r: any) => r.code !== code);

      await serviceClient.from('app_settings').upsert({
        setting_key: 'custom_roles',
        setting_value: filtered,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Clean up role_permission_overrides
    await serviceClient
      .from('role_permission_overrides')
      .delete()
      .eq('role', code);

    // 5. Audit log
    await serviceClient.from('permission_audit_logs').insert({
      action: 'revoke',
      user_id: admin.id,
      permission_code: '*',
      performed_by: admin.id,
      old_value: { role: code },
      new_value: null,
      reason: `Xóa vai trò tùy biến '${code}'`,
      scope: 'role',
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa vai trò '${code}' thành công`,
    });
  } catch (error: any) {
    console.error('[Roles Detail API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
