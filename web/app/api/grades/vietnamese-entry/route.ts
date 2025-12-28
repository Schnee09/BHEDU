import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Vietnamese Grade Entry API (Simplified)
 * Grades are stored directly with subject_id + class_id
 * Structure: grades → subjects + classes (no categories needed)
 */

// GET: Fetch students with their grades for a specific class, subject, and semester
export async function GET(req: NextRequest) {
  const session = await teacherAuth(req);
  if (!session.authorized) {
    return NextResponse.json({ success: false, error: session.reason || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get("class_id");
  const subject_code = searchParams.get("subject_code");
  const semester = searchParams.get("semester");

  if (!class_id || !semester) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters (class_id, semester)" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServiceClient();

    let subjectId: string | null = null;

    // Education Center Model: Get subject_id from class
    // If subject_code equals class_id OR is not provided, get subject from class
    if (!subject_code || subject_code === class_id) {
      const { data: classData } = await supabase
        .from("classes")
        .select("subject_id")
        .eq("id", class_id)
        .maybeSingle();
      
      subjectId = classData?.subject_id || null;
    } else {
      // Legacy: Look up subject by code
      const { data: subject } = await supabase
        .from("subjects")
        .select("id")
        .eq("code", subject_code)
        .maybeSingle();
      
      subjectId = subject?.id || null;
    }

    // If still no subject, use the first subject as fallback
    if (!subjectId) {
      const { data: fallbackSubject } = await supabase
        .from("subjects")
        .select("id")
        .limit(1)
        .single();
      subjectId = fallbackSubject?.id || null;
    }

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: "No subject found" },
        { status: 404 }
      );
    }

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

    // Build students list
    const baseStudents = enrollments.map((enrollment: any) => ({
      id: enrollment.student_id,
      student_code: enrollment.profiles.student_code || "",
      full_name: enrollment.profiles.full_name,
    }));

    const studentIds = enrollments.map((e: any) => e.student_id);
    const gradeMap: Record<string, Record<string, number>> = {};

    // Fetch grades by subject_id, class_id, student_id, and semester
    const { data: existingGrades, error: gradeError } = await supabase
      .from("grades")
      .select("student_id, component_type, points_earned, score")
      .eq("subject_id", subjectId)
      .eq("class_id", class_id)
      .eq("semester", semester)
      .in("student_id", studentIds);

    if (gradeError) {
      console.error("Error fetching grades:", gradeError);
    } else if (existingGrades) {
      existingGrades.forEach((grade: any) => {
        if (!gradeMap[grade.student_id]) {
          gradeMap[grade.student_id] = {};
        }
        if (grade.component_type) {
          // Use points_earned or score, both should be 0-10 scale now
          gradeMap[grade.student_id][grade.component_type] = grade.points_earned ?? grade.score ?? null;
        }
      });
    }

    // Build student list with grades
    const students = baseStudents.map((s: any) => ({
      ...s,
      grades: {
        oral: gradeMap[s.id]?.oral ?? null,
        fifteen_min: gradeMap[s.id]?.fifteen_min ?? null,
        one_period: gradeMap[s.id]?.one_period ?? null,
        midterm: gradeMap[s.id]?.midterm ?? null,
        final: gradeMap[s.id]?.final ?? null,
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
  if (!session || !session.authorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    
    const body = await req.json();
    const { class_id, subject_code, semester, students } = body;

    if (!class_id || !semester || !Array.isArray(students)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data (class_id, semester, students required)" },
        { status: 400 }
      );
    }

    let subjectId: string | null = null;

    // Education Center Model: Get subject_id from class
    if (!subject_code || subject_code === class_id) {
      const { data: classData } = await supabase
        .from("classes")
        .select("subject_id")
        .eq("id", class_id)
        .maybeSingle();
      
      subjectId = classData?.subject_id || null;
    } else {
      // Legacy: Look up subject by code
      const { data: subject } = await supabase
        .from("subjects")
        .select("id")
        .eq("code", subject_code)
        .maybeSingle();
      
      subjectId = subject?.id || null;
    }

    // Fallback to first subject if none found
    if (!subjectId) {
      const { data: fallbackSubject } = await supabase
        .from("subjects")
        .select("id")
        .limit(1)
        .single();
      subjectId = fallbackSubject?.id || null;
    }

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: "No subject found" },
        { status: 404 }
      );
    }

    let savedCount = 0;
    const errors: string[] = [];

    // Component types
    const componentTypes = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];

    // Process each student's grades
    for (const student of students) {
      for (const componentType of componentTypes) {
        const gradeValue = student.grades?.[componentType];
        if (gradeValue === null || gradeValue === undefined) continue;

        // Upsert: delete existing then insert
        await supabase
          .from("grades")
          .delete()
          .eq("subject_id", subjectId)
          .eq("class_id", class_id)
          .eq("student_id", student.student_id)
          .eq("component_type", componentType)
          .eq("semester", semester);

        const { error: gradeError } = await supabase
          .from("grades")
          .insert({
            subject_id: subjectId,
            class_id: class_id,
            student_id: student.student_id,
            score: gradeValue,
            points_earned: gradeValue,
            component_type: componentType,
            semester: semester,
            graded_by: session.userId,
            graded_at: new Date().toISOString(),
          });

        if (gradeError) {
          errors.push(`Error saving ${componentType} for ${student.student_id}: ${gradeError.message}`);
        } else {
          savedCount++;
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Some grades failed to save",
        details: errors,
        saved: savedCount
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Grades saved successfully",
      count: savedCount 
    });
  } catch (error: any) {
    console.error("Error saving Vietnamese grades:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
