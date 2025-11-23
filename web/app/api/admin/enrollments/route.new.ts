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
    const status = searchParams.get("status");

    let query = supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        class_id,
        enrollment_date,
        status,
        student:profiles!enrollments_student_id_fkey(id, full_name, email),
        class:classes!enrollments_class_id_fkey(id, name)
      `)
      .order("enrollment_date", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error("[API] Enrollments error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, status = "active" } = body;

    if (!student_id || !class_id) {
      return NextResponse.json(
        { success: false, error: "Student ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", class_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Student is already enrolled in this class" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id,
        class_id,
        status,
        enrollment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Create enrollment error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
