import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all data from main tables
    const [students, classes, grades, attendance, profiles] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("classes").select("*"),
      supabase.from("grades").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("profiles").select("*"),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
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
      user_id: user.id,
      user_email: user.email,
      action: "export",
      resource_type: "backup",
      new_data: { counts: exportData.counts },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
