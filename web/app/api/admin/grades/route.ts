import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const assignmentId = searchParams.get("assignment_id");
    const classId = searchParams.get("class_id");

    const { supabase } = await getDataClient(request)

    // First, get grade records
    let query = supabase
      .from('grades')
      .select('*')
      .order('created_at', { ascending: false })

    if (studentId) query = query.eq("student_id", studentId);
    if (assignmentId) query = query.eq("assignment_id", assignmentId);

    const { data: gradeData, error: gradeError } = await query;
    if (gradeError) throw gradeError;

    if (!gradeData || gradeData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

  // Get unique student and assignment IDs
  const studentIds = [...new Set(gradeData.map((g: any) => g.student_id))];
  const assignmentIds = [...new Set(gradeData.map((g: any) => g.assignment_id))];

    // Fetch students
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds);

    // Fetch assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, class_id, max_points')
      .in('id', assignmentIds);

    // Create lookup maps
  const studentMap = new Map((students || []).map((s: any) => [s.id, s]));
  const assignmentMap = new Map((assignments || []).map((a: any) => [a.id, a]));

    // Filter by class if specified
  let filteredData = gradeData;
    if (classId) {
      const classAssignmentIds = assignments?.filter(a => a.class_id === classId).map(a => a.id) || [];
      filteredData = gradeData.filter(g => classAssignmentIds.includes(g.assignment_id));
    }

    // Combine data
    const enrichedData = filteredData.map((grade: any) => ({
      ...grade,
      student: studentMap.get(grade.student_id) || null,
      assignment: assignmentMap.get(grade.assignment_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
    });
  } catch (error: any) {
    console.error("[API] Grades error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await getDataClient(request)
    const body = await request.json();
    const { assignment_id, student_id, score, feedback, graded_by } = body;

    if (!assignment_id || !student_id) {
      return NextResponse.json(
        { success: false, error: "Assignment ID and Student ID are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("grades")
      .upsert({
        assignment_id,
        student_id,
        score,
        feedback,
        graded_by,
        graded_at: new Date().toISOString(),
      }, {
        onConflict: "assignment_id,student_id"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Create/update grade error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
