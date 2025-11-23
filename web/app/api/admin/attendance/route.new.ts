import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const classId = searchParams.get("class_id");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let query = supabase
      .from("attendance")
      .select(`
        id,
        student_id,
        class_id,
        date,
        status,
        check_in_time,
        check_out_time,
        notes,
        marked_by,
        created_at,
        student:profiles!attendance_student_id_fkey(id, full_name, email),
        class:classes!attendance_class_id_fkey(id, name)
      `)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (date) query = query.eq("date", date);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error("[API] Attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, date, status, check_in_time, check_out_time, notes, marked_by } = body;

    if (!student_id || !class_id || !date || !status) {
      return NextResponse.json(
        { success: false, error: "Student ID, Class ID, date, and status are required" },
        { status: 400 }
      );
    }

    // Check if record exists for this student/class/date
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", class_id)
      .eq("date", date)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("attendance")
        .update({ status, check_in_time, check_out_time, notes, marked_by })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          student_id,
          class_id,
          date,
          status,
          check_in_time,
          check_out_time,
          notes,
          marked_by,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error("[API] Create/update attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
