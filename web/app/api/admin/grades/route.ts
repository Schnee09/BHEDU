/**
 * Admin Grades API (Vietnamese Education System)
 * GET /api/admin/grades - Get all grades with filtering
 * POST /api/admin/grades - Create/update grades with full metadata
 *
 * Required fields for POST:
 * - student_id: UUID of the student
 * - class_id: UUID of the class
 * - subject_id: UUID of the subject
 * - component_type: Grade component (oral, fifteen_min, one_period, midterm, final)
 * - semester: Semester identifier ("1" or "2")
 * - score: Numeric score (0-10)
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";

const VALID_COMPONENT_TYPES = [
  "oral",
  "fifteen_min",
  "one_period",
  "midterm",
  "final",
];
const VALID_SEMESTERS = ["1", "2"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");
    const semester = searchParams.get("semester");
    const componentType = searchParams.get("component_type");

    const { supabase } = await getDataClient(request);

    // Build query using new schema
    let query = supabase
      .from("grades")
      .select(`
        *,
        student:profiles!grades_student_id_fkey(id, full_name, email, student_code),
        class:classes!grades_class_id_fkey(id, name),
        subject:subjects!grades_subject_id_fkey(id, name, code)
      `)
      .order("created_at", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (subjectId) query = query.eq("subject_id", subjectId);
    if (semester) query = query.eq("semester", semester);
    if (componentType) query = query.eq("component_type", componentType);

    const { data: gradeData, error: gradeError } = await query;
    if (gradeError) throw gradeError;

    return NextResponse.json({
      success: true,
      data: gradeData || [],
      total: gradeData?.length || 0,
    });
  } catch (error: any) {
    console.error("[API] Grades error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getDataClient(request);
    const userId = user?.id;
    const body = await request.json();
    const {
      student_id,
      class_id,
      subject_id,
      component_type,
      semester,
      score,
      feedback,
    } = body;

    // Validate required fields
    if (
      !student_id || !class_id || !subject_id || !component_type || !semester ||
      score === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "student_id, class_id, subject_id, component_type, semester, and score are required",
        },
        { status: 400 },
      );
    }

    // Validate component_type
    if (!VALID_COMPONENT_TYPES.includes(component_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid component_type. Must be one of: ${
            VALID_COMPONENT_TYPES.join(", ")
          }`,
        },
        { status: 400 },
      );
    }

    // Validate semester
    if (!VALID_SEMESTERS.includes(semester)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid semester. Must be one of: ${
            VALID_SEMESTERS.join(", ")
          }`,
        },
        { status: 400 },
      );
    }

    // Validate score (Vietnamese 0-10 scale)
    if (score < 0 || score > 10) {
      return NextResponse.json(
        { success: false, error: "Score must be between 0 and 10" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("grades")
      .upsert(
        {
          student_id,
          class_id,
          subject_id,
          component_type,
          semester,
          score,
          points_earned: score,
          feedback: feedback || null,
          graded_by: userId,
          graded_at: new Date().toISOString(),
        },
        {
          onConflict: "student_id,class_id,subject_id,component_type,semester",
        },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Create/update grade error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
