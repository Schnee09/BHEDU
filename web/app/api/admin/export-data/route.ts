import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import type { PermissionCode } from '@/lib/auth/core';

const EXPORTABLE_TABLES = new Set([
  'profiles',
  'students',
  'guardians',
  'enrollments',
  'classes',
  'courses',
  'lessons',
  'academic_years',
  'grading_scales',
  'grades',
  'assignments',
  'attendance',
  'fee_types',
  'invoices',
  'invoice_items',
  'payments',
  'payment_allocations',
  'audit_logs',
  'school_settings',
  'role_permission_overrides',
]);

const EXPORTABLE_MODULES = new Set([
  'students',
  'academic',
  'grades',
  'attendance',
  'finance',
  'system',
]);
const SYSTEM_TABLES = new Set(['audit_logs', 'school_settings', 'role_permission_overrides']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get('module');
    const tableParam = searchParams.get('table');

    if (moduleParam && !EXPORTABLE_MODULES.has(moduleParam)) {
      return NextResponse.json({ error: 'Phạm vi xuất dữ liệu không hợp lệ' }, { status: 400 });
    }
    if (tableParam && !EXPORTABLE_TABLES.has(tableParam)) {
      return NextResponse.json({ error: 'Bảng dữ liệu không được phép xuất' }, { status: 400 });
    }

    const requiredPermission: PermissionCode =
      !moduleParam && !tableParam
        ? 'system.database'
        : moduleParam === 'system' || (tableParam ? SYSTEM_TABLES.has(tableParam) : false)
          ? 'system.database'
          : 'reports.export';
    const auth = await getAuthContext(request, requiredPermission);
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const userId = auth.profile.id;
    const userEmail = auth.profile.email;
    const supabase = createServiceClient();

    // Single Table Export
    if (tableParam) {
      const { data, error } = await supabase.from(tableParam).select('*').limit(5000);
      if (error) {
        return NextResponse.json(
          { error: `Không thể xuất dữ liệu bảng ${tableParam}: ${error.message}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        table: tableParam,
        exportedAt: new Date().toISOString(),
        exportedBy: userEmail,
        count: data?.length || 0,
        data: data || [],
      });
    }

    // Module or Full Export
    const exportPayload: Record<string, any> = {};
    const counts: Record<string, number> = {};

    const tableList =
      moduleParam === 'students'
        ? ['profiles', 'students', 'guardians', 'enrollments']
        : moduleParam === 'academic'
          ? ['classes', 'courses', 'lessons', 'academic_years', 'grading_scales']
          : moduleParam === 'grades'
            ? ['grades', 'assignments', 'grading_scales']
            : moduleParam === 'attendance'
              ? ['attendance']
              : moduleParam === 'finance'
                ? ['fee_types', 'invoices', 'invoice_items', 'payments', 'payment_allocations']
                : moduleParam === 'system'
                  ? ['audit_logs', 'school_settings', 'role_permission_overrides']
                  : [
                      'profiles',
                      'students',
                      'classes',
                      'enrollments',
                      'attendance',
                      'grades',
                      'assignments',
                      'courses',
                      'lessons',
                      'academic_years',
                      'grading_scales',
                      'fee_types',
                      'invoices',
                      'invoice_items',
                      'payments',
                      'school_settings',
                      'audit_logs',
                    ];

    const fetchPromises = tableList.map(async (table) => {
      const res = await supabase.from(table).select('*').limit(5000);
      return { table, data: res.data || [], count: res.data?.length || 0 };
    });

    const results = await Promise.all(fetchPromises);
    results.forEach((r) => {
      exportPayload[r.table] = r.data;
      counts[r.table] = r.count;
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: userEmail,
      scope: moduleParam || 'full_database',
      version: '2.0',
      counts,
      data: exportPayload,
    };

    // Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action: 'export',
      resource_type: 'backup',
      new_data: { scope: moduleParam || 'full_database', counts },
    });

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to export data' }, { status: 500 });
  }
}
