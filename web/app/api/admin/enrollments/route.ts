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

    // First, get enrollment records
    let query = supabase
      .from("enrollments")
      .select("*")
      .order("enrollment_date", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (status) query = query.eq("status", status);

    const { data: enrollmentData, error: enrollmentError } = await query;
    if (enrollmentError) throw enrollmentError;

    if (!enrollmentData || enrollmentData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique student and class IDs
    const studentIds = [...new Set(enrollmentData.map(e => e.student_id))];
    const classIds = [...new Set(enrollmentData.map(e => e.class_id))];

    // Fetch students
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);

    // Fetch classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    // Create lookup maps
    const studentMap = new Map(students?.map(s => [s.id, s]) || []);
    const classMap = new Map(classes?.map(c => [c.id, c]) || []);

    // Combine data
    const enrichedData = enrollmentData.map(enrollment => ({
      ...enrollment,
      student: studentMap.get(enrollment.student_id) || null,
      class: classMap.get(enrollment.class_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
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
