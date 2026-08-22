import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminAuth } from "@/lib/auth/adminAuth";

export async function GET(request: Request) {
  try {
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || "Forbidden" }, {
        status: auth.userId ? 403 : 401,
      });
    }

    const { userId, userEmail } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get('module');
    const tableParam = searchParams.get('table');

    // Single Table Export
    if (tableParam) {
      const { data, error } = await supabase.from(tableParam).select('*').limit(5000);
      if (error) {
        return NextResponse.json({ error: `Không thể xuất dữ liệu bảng ${tableParam}: ${error.message}` }, { status: 400 });
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

    const tableList = moduleParam === 'students'
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
    await supabase.from("audit_logs").insert({
      user_id: userId,
      user_email: userEmail,
      action: "export",
      resource_type: "backup",
      new_data: { scope: moduleParam || 'full_database', counts },
    });

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to export data" },
      { status: 500 },
    );
  }
}
