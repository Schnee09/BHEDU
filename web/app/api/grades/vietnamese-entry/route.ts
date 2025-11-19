import { createClientFromRequest } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch students with their grades for a specific class, subject, and semester
export async function GET(req: NextRequest) {
  const session = await teacherAuth(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get("class_id");
  const subject_code = searchParams.get("subject_code");
  const semester = searchParams.get("semester");

  if (!class_id || !subject_code || !semester) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClientFromRequest(req as any);

    // Get students in the class
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        student_id,
        profiles!inner(
          id,
          full_name,
          student_code
        )
      `)
      .eq("class_id", class_id)
      .order("profiles(full_name)");

    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Get all grades for these students in this subject and semester
    const studentIds = enrollments.map((e: any) => e.student_id);
    
    const { data: existingGrades, error: gradeError } = await supabase
      .from("grades")
      .select("*")
      .in("student_id", studentIds)
      .eq("subject_code", subject_code)
      .eq("semester", semester);

    if (gradeError) throw gradeError;

    // Build grade map by student and component type
    const gradeMap: Record<string, Record<string, number>> = {};
    existingGrades?.forEach((grade: any) => {
      if (!gradeMap[grade.student_id]) {
        gradeMap[grade.student_id] = {};
      }
      if (grade.component_type) {
        gradeMap[grade.student_id][grade.component_type] = grade.grade;
      }
    });

    // Build student list with grades
    const students = enrollments.map((enrollment: any) => ({
      id: enrollment.student_id,
      student_code: enrollment.profiles.student_code || "",
      full_name: enrollment.profiles.full_name,
      grades: {
        oral: gradeMap[enrollment.student_id]?.oral ?? null,
        fifteen_min: gradeMap[enrollment.student_id]?.fifteen_min ?? null,
        one_period: gradeMap[enrollment.student_id]?.one_period ?? null,
        midterm: gradeMap[enrollment.student_id]?.midterm ?? null,
        final: gradeMap[enrollment.student_id]?.final ?? null,
      },
    }));

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error("Error fetching Vietnamese grades:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Save grades for multiple students
export async function POST(req: NextRequest) {
  const session = await teacherAuth(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClientFromRequest(req as any);
    
    const body = await req.json();
    const { class_id, subject_code, semester, students } = body;

    if (!class_id || !subject_code || !semester || !Array.isArray(students)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Get academic year for the class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("academic_year_id")
      .eq("id", class_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const academic_year_id = classData.academic_year_id;

    // Prepare grade records to upsert
    const gradeRecords = [];
    
    for (const student of students) {
      const { student_id, grades } = student;

      // Create a grade record for each component type that has a value
      for (const [componentType, gradeValue] of Object.entries(grades)) {
        if (gradeValue !== null && gradeValue !== undefined) {
          gradeRecords.push({
            student_id,
            subject_code,
            semester,
            academic_year_id,
            component_type: componentType,
            grade: gradeValue,
            teacher_id: session.userId,
            date: new Date().toISOString().split("T")[0],
          });
        }
      }
    }

    if (gradeRecords.length === 0) {
      return NextResponse.json({ success: true, message: "No grades to save" });
    }

    // Delete existing grades for these students/subject/semester/components
    const studentIds = students.map((s: any) => s.student_id);
    
    const { error: deleteError } = await supabase
      .from("grades")
      .delete()
      .in("student_id", studentIds)
      .eq("subject_code", subject_code)
      .eq("semester", semester)
      .eq("academic_year_id", academic_year_id);

    if (deleteError) {
      console.error("Error deleting old grades:", deleteError);
      // Continue anyway to try insert
    }

    // Insert new grades
    const { error: insertError } = await supabase
      .from("grades")
      .insert(gradeRecords);

    if (insertError) {
      console.error("Error inserting grades:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Grades saved successfully",
      count: gradeRecords.length 
    });
  } catch (error: any) {
    console.error("Error saving Vietnamese grades:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
