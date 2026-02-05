import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminAuth } from "@/lib/auth/adminAuth";

export async function GET(request: Request) {
  try {
    // Use the centralized adminAuth helper which supports super_admin via inheritance
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || "Forbidden" }, {
        status: auth.userId ? 403 : 401,
      });
    }

    const { userId, userEmail } = auth;
    const supabase = await createClient();

    // Fetch all data from main tables
    const [students, classes, grades, attendance, profiles] = await Promise.all(
      [
        supabase.from("students").select("*"),
        supabase.from("classes").select("*"),
        supabase.from("grades").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("profiles").select("*"),
      ],
    );

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: userEmail,
      version: "1.0",
      data: {
        students: students.data || [],
        classes: classes.data || [],
        grades: grades.data || [],
        attendance: attendance.data || [],
        profiles: profiles.data || [],
      },
      counts: {
        students: students.data?.length || 0,
        classes: classes.data?.length || 0,
        grades: grades.data?.length || 0,
        attendance: attendance.data?.length || 0,
        profiles: profiles.data?.length || 0,
      },
    };

    // Log audit entry
    await supabase.from("audit_logs").insert({
      user_id: userId,
      user_email: userEmail,
      action: "export",
      resource_type: "backup",
      new_data: { counts: exportData.counts },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
