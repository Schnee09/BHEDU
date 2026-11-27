/**
 * Custom Role Detail API
 * PUT /api/admin/roles/[code] — Update custom role
 * DELETE /api/admin/roles/[code] — Safely delete custom role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { PermissionCode, UserRole } from '@/lib/auth/core';
import {
  canManageRolePermissions,
  isValidPermissionCode,
  isValidRoleCode,
} from '@/lib/auth/permissionManagement';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';

const SYSTEM_ROLE_CODES = [
  'super_admin',
  'owner',
  'admin',
  'teacher',
  'tutor',
  'parent',
  'student',
];

const MAX_ROLE_NAME_LENGTH = 100;
const MAX_ROLE_DESCRIPTION_LENGTH = 500;
const MAX_ROLE_COLOR_LENGTH = 300;

interface RouteContext {
  params: Promise<{ code: string }>;
}

async function getPermissionManager(request: NextRequest) {
  return getAuthContext(request, 'permissions.manage');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const auth = await getPermissionManager(request);
    if (!auth.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const admin = { id: auth.profile.id, role: auth.role };

    if (!isValidRoleCode(code)) {
      return NextResponse.json({ error: 'Mã vai trò không hợp lệ' }, { status: 400 });
    }
    if (!canManageRolePermissions(admin.role, code as UserRole)) {
      return NextResponse.json({ error: 'Không thể quản lý vai trò này' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Dữ liệu vai trò không hợp lệ' }, { status: 400 });
    }
    const { name, description, color, permissions } = body;

    if (
      (name !== undefined &&
        (typeof name !== 'string' || !name.trim() || name.trim().length > MAX_ROLE_NAME_LENGTH)) ||
      (description !== undefined &&
        (typeof description !== 'string' ||
          description.trim().length > MAX_ROLE_DESCRIPTION_LENGTH)) ||
      (color !== undefined &&
        (typeof color !== 'string' || !color.trim() || color.trim().length > MAX_ROLE_COLOR_LENGTH))
    ) {
      return NextResponse.json(
        { error: 'Thông tin hiển thị vai trò không hợp lệ' },
        { status: 400 }
      );
    }

    if (
      permissions !== undefined &&
      (!Array.isArray(permissions) ||
        permissions.length > 100 ||
        permissions.some(
          (permission) => typeof permission !== 'string' || !isValidPermissionCode(permission)
        ))
    ) {
      return NextResponse.json({ error: 'Danh sách quyền không hợp lệ' }, { status: 400 });
    }

    if (admin.role !== 'super_admin' && Array.isArray(permissions)) {
      const delegationChecks = await Promise.all(
        permissions.map((permission: string) =>
          resolveServerPermission(admin.id, admin.role, permission as PermissionCode)
        )
      );
      if (delegationChecks.some((allowed) => !allowed)) {
        return NextResponse.json(
          { error: 'Không thể cấp quyền cao hơn quyền của tài khoản hiện tại' },
          { status: 403 }
        );
      }
    }

    const isSystemRole = SYSTEM_ROLE_CODES.includes(code.toLowerCase());

    const serviceClient = createServiceClient();

    if (!isSystemRole) {
      // 1. Update in custom_roles table
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (color) updateData.color = color.trim();

      const { data: updatedRole, error: updateError } = await serviceClient
        .from('custom_roles')
        .update(updateData)
        .eq('code', code)
        .select('code')
        .maybeSingle();

      if (updateError) {
        throw new Error(`Không thể cập nhật vai trò tùy chỉnh: ${updateError.message}`);
      }
      if (!updatedRole) {
        return NextResponse.json({ error: 'Không tìm thấy vai trò tùy chỉnh' }, { status: 404 });
      }
    }

    // 2. If permissions array is provided, sync role_permission_overrides
    if (Array.isArray(permissions)) {
      // Clear existing overrides for this role
      await serviceClient.from('role_permission_overrides').delete().eq('role', code);

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
  } catch (error: unknown) {
    console.error('[Roles Detail API] PUT error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const auth = await getPermissionManager(request);
    if (!auth.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const admin = { id: auth.profile.id, role: auth.role };

    if (!isValidRoleCode(code)) {
      return NextResponse.json({ error: 'Mã vai trò không hợp lệ' }, { status: 400 });
    }
    if (!canManageRolePermissions(admin.role, code as UserRole)) {
      return NextResponse.json({ error: 'Không thể quản lý vai trò này' }, { status: 403 });
    }

    if (SYSTEM_ROLE_CODES.includes(code.toLowerCase())) {
      return NextResponse.json(
        { error: 'Không thể xóa các vai trò hệ thống mặc định' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Safety Check: Check if any user currently has this role
    const { count: usersWithRole, error: usageError } = await serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', code);

    if (usageError) {
      throw new Error(`Không thể kiểm tra tài khoản đang dùng vai trò: ${usageError.message}`);
    }

    if (usersWithRole && usersWithRole > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa vai trò này vì đang có ${usersWithRole} tài khoản sử dụng. Vui lòng chuyển các tài khoản sang vai trò khác trước khi xóa.`,
        },
        { status: 400 }
      );
    }

    // 2. Delete from the canonical custom_roles table
    const { error: deleteError } = await serviceClient
      .from('custom_roles')
      .delete()
      .eq('code', code);
    if (deleteError) {
      throw new Error(`Không thể xóa vai trò tùy chỉnh: ${deleteError.message}`);
    }

    // 3. Clean up role_permission_overrides
    await serviceClient.from('role_permission_overrides').delete().eq('role', code);

    // 4. Audit log
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
  } catch (error: unknown) {
    console.error('[Roles Detail API] DELETE error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details }, { status: 500 });
  }
}
