import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getDataClient(request)
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const assignmentId = searchParams.get("assignment_id");
    const classId = searchParams.get("class_id");

    let query = supabase
      .from('grades')
      .select(`
        id,
        assignment_id,
        student_id,
        score,
        feedback,
        graded_at,
        graded_by,
        created_at,
        updated_at,
        student:profiles!grades_student_id_fkey(id, full_name, email),
        assignment:assignments!grades_assignment_id_fkey(id, title)
      `)
      .order('created_at', { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (assignmentId) query = query.eq("assignment_id", assignmentId);

    const { data, error } = await query;
    if (error) throw error;

    // If filtering by class, get assignments for that class first
    let filteredData = data || [];
    if (classId) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("class_id", classId);
      
      const assignmentIds = assignments?.map(a => a.id) || [];
      filteredData = filteredData.filter(g => assignmentIds.includes(g.assignment_id));
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
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
