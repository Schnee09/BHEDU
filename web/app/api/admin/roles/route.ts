/**
 * Admin Roles Management API
 * GET  /api/admin/roles — List all system and custom roles
 * POST /api/admin/roles — Create a new custom role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { BASE_ROLE_PERMISSIONS, UserRole, PermissionCode } from '@/lib/auth/core';

export interface RoleInfo {
  code: string;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  user_count: number;
  permission_count: number;
  created_at?: string;
}

const SYSTEM_ROLES: RoleInfo[] = [
  {
    code: 'super_admin',
    name: 'Quản trị Hệ thống',
    description: 'Toàn quyền cấu hình, bảo mật và quản trị toàn bộ hệ thống.',
    color: 'bg-stone-900 text-white dark:bg-white/10 dark:text-white',
    is_system: true,
    user_count: 0,
    permission_count: 50,
  },
  {
    code: 'owner',
    name: 'Chủ trung tâm',
    description: 'Giám sát chiến lược, quản trị tài chính, nhân sự và báo cáo toàn diện.',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.owner?.length || 32,
  },
  {
    code: 'admin',
    name: 'Quản trị viên',
    description: 'Điều hành hoạt động học vụ, lớp học, giáo viên và tài khoản.',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.admin?.length || 24,
  },
  {
    code: 'teacher',
    name: 'Giáo viên',
    description: 'Quản lý lớp học, nhập điểm, điểm danh và trao đổi chuyên môn.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.teacher?.length || 7,
  },
  {
    code: 'tutor',
    name: 'Gia sư',
    description: 'Quản lý các buổi dạy kèm 1-1, điểm danh và đánh giá học sinh.',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.tutor?.length || 3,
  },
  {
    code: 'parent',
    name: 'Phụ huynh',
    description: 'Tra cứu kết quả học tập, thời khóa biểu và nhận thông báo học vụ.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.parent?.length || 2,
  },
  {
    code: 'student',
    name: 'Học sinh',
    description: 'Xem thời khóa biểu, bảng điểm, bài tập và tham gia lớp học.',
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    is_system: true,
    user_count: 0,
    permission_count: BASE_ROLE_PERMISSIONS.student?.length || 7,
  },
];

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

  if (!['super_admin', 'owner', 'admin'].includes(profile?.role || '')) return null;
  return profile;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getSuperAdminProfile(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // 1. Fetch user counts grouped by role
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('role');

    const countsByRole: Record<string, number> = {};
    (profiles || []).forEach((p) => {
      if (p.role) {
        countsByRole[p.role] = (countsByRole[p.role] || 0) + 1;
      }
    });

    // 2. Fetch custom roles from custom_roles table or app_settings
    let customRoles: RoleInfo[] = [];

    const { data: customRolesData, error: customRolesError } = await serviceClient
      .from('custom_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!customRolesError && customRolesData) {
      customRoles = customRolesData.map((r: any) => ({
        code: r.code,
        name: r.name,
        description: r.description || '',
        color: r.color || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        is_system: false,
        user_count: countsByRole[r.code] || 0,
        permission_count: r.permission_count || 0,
        created_at: r.created_at,
      }));
    } else {
      // Fallback: check app_settings for custom_roles metadata
      const { data: settingsData } = await serviceClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'custom_roles')
        .maybeSingle();

      if (settingsData?.setting_value) {
        const stored = Array.isArray(settingsData.setting_value)
          ? settingsData.setting_value
          : JSON.parse(settingsData.setting_value || '[]');

        customRoles = stored.map((r: any) => ({
          code: r.code,
          name: r.name,
          description: r.description || '',
          color: r.color || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          is_system: false,
          user_count: countsByRole[r.code] || 0,
          permission_count: r.permissions?.length || 0,
          created_at: r.created_at,
        }));
      }
    }

    // 3. Count active permissions for each custom role from role_permission_overrides
    const { data: overrides } = await serviceClient
      .from('role_permission_overrides')
      .select('role, is_denied');

    const permCounts: Record<string, number> = {};
    (overrides || []).forEach((o) => {
      if (!o.is_denied) {
        permCounts[o.role] = (permCounts[o.role] || 0) + 1;
      }
    });

    // Merge system roles with counts
    const systemRolesWithCounts = SYSTEM_ROLES.map((r) => ({
      ...r,
      user_count: countsByRole[r.code] || 0,
    }));

    // Merge custom roles with live perm counts
    const customRolesWithCounts = customRoles.map((r) => ({
      ...r,
      permission_count: permCounts[r.code] ?? r.permission_count,
    }));

    return NextResponse.json({
      success: true,
      roles: [...systemRolesWithCounts, ...customRolesWithCounts],
      systemRoles: systemRolesWithCounts,
      customRoles: customRolesWithCounts,
    });
  } catch (error: any) {
    console.error('[Roles API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getSuperAdminProfile(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, description, color, permissions = [] } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Mã vai trò (code) và Tên hiển thị (name) là bắt buộc' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');

    // Prevent overwriting system roles
    const reservedCodes = SYSTEM_ROLES.map((r) => r.code);
    if (reservedCodes.includes(normalizedCode)) {
      return NextResponse.json(
        { error: `Mã vai trò '${normalizedCode}' trùng với vai trò hệ thống cốt lõi` },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const newRoleData = {
      code: normalizedCode,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      created_by: admin.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Try inserting into custom_roles table
    const { error: insertError } = await serviceClient
      .from('custom_roles')
      .insert(newRoleData);

    if (insertError) {
      // Fallback: save to app_settings
      const { data: existingSettings } = await serviceClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'custom_roles')
        .maybeSingle();

      const existingList = existingSettings?.setting_value
        ? Array.isArray(existingSettings.setting_value)
          ? existingSettings.setting_value
          : JSON.parse(existingSettings.setting_value)
        : [];

      if (existingList.some((r: any) => r.code === normalizedCode)) {
        return NextResponse.json(
          { error: `Vai trò với mã '${normalizedCode}' đã tồn tại` },
          { status: 400 }
        );
      }

      existingList.push({ ...newRoleData, permissions });

      await serviceClient.from('app_settings').upsert({
        setting_key: 'custom_roles',
        setting_value: existingList,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Grant initial permissions via role_permission_overrides
    if (Array.isArray(permissions) && permissions.length > 0) {
      const overridesToInsert = permissions.map((pCode: string) => ({
        role: normalizedCode,
        permission_code: pCode,
        is_denied: false,
        granted_by: admin.id,
        notes: `Cấp quyền ban đầu khi tạo vai trò '${name}'`,
        updated_at: new Date().toISOString(),
      }));

      await serviceClient
        .from('role_permission_overrides')
        .upsert(overridesToInsert, { onConflict: 'role,permission_code' });
    }

    // 3. Log audit event
    await serviceClient.from('permission_audit_logs').insert({
      action: 'grant',
      user_id: admin.id,
      permission_code: '*',
      performed_by: admin.id,
      old_value: null,
      new_value: { role: normalizedCode, name, permissionsCount: permissions.length },
      reason: `Tạo vai trò mới '${name}' (${normalizedCode})`,
      scope: 'role',
    });

    return NextResponse.json({
      success: true,
      message: `Đã tạo vai trò '${name}' thành công`,
      role: {
        ...newRoleData,
        is_system: false,
        user_count: 0,
        permission_count: permissions.length,
      },
    });
  } catch (error: any) {
    console.error('[Roles API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
