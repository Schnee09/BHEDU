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
    
    // Query grades through assignments and categories
    const { data: existingGrades, error: gradeError } = await supabase
      .from("grades")
      .select(`
        *,
        assignment:assignments!inner(
          category:grade_categories!inner(code)
        )
      `)
      .in("student_id", studentIds)
      .eq("assignment.category.code", subject_code)
      .eq("semester", semester);

    if (gradeError) {
      console.error("Error fetching grades:", gradeError);
      throw gradeError;
    }

    // Build grade map by student and component type
    const gradeMap: Record<string, Record<string, number>> = {};
    existingGrades?.forEach((grade: any) => {
      if (!gradeMap[grade.student_id]) {
        gradeMap[grade.student_id] = {};
      }
      if (grade.component_type && grade.points_earned !== null) {
        gradeMap[grade.student_id][grade.component_type] = grade.points_earned;
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
  if (!session || !session.authorized) {
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

    // Get academic year and category for the class/subject
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

    // Get the grade category for this subject
    const { data: category, error: catError } = await supabase
      .from("grade_categories")
      .select("id")
      .eq("code", subject_code)
      .eq("class_id", class_id)
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { success: false, error: "Subject category not found for this class" },
        { status: 404 }
      );
    }

    const academic_year_id = classData.academic_year_id;
    let savedCount = 0;
    const errors: string[] = [];

    // Component type definitions with weights
    const componentTypes = {
      oral: { name_vi: 'Điểm miệng', weight: 1, order: 1 },
      fifteen_min: { name_vi: 'Điểm 15 phút', weight: 1, order: 2 },
      one_period: { name_vi: 'Điểm 1 tiết', weight: 2, order: 3 },
      midterm: { name_vi: 'Điểm giữa kỳ', weight: 2, order: 4 },
      final: { name_vi: 'Điểm cuối kỳ', weight: 3, order: 5 },
    };

    // Process each component type
    for (const [componentType, config] of Object.entries(componentTypes)) {
      // Create or get assignment for this component type + semester
      const assignmentTitle = `${config.name_vi} - ${semester}`;
      
      let assignment;
      const { data: existingAssignment } = await supabase
        .from("assignments")
        .select("id, total_points")
        .eq("category_id", category.id)
        .eq("title", assignmentTitle)
        .maybeSingle();

      if (existingAssignment) {
        assignment = existingAssignment;
      } else {
        // Create new assignment
        const { data: newAssignment, error: assignError } = await supabase
          .from("assignments")
          .insert({
            category_id: category.id,
            title: assignmentTitle,
            description: `${config.name_vi} cho ${semester}`,
            total_points: 10, // Vietnamese scale 0-10
            due_date: new Date().toISOString(),
            published: true,
          })
          .select("id, total_points")
          .single();

        if (assignError || !newAssignment) {
          errors.push(`Failed to create assignment for ${componentType}`);
          continue;
        }
        assignment = newAssignment;
      }

      // Save grades for all students for this component
      for (const student of students) {
        const gradeValue = student.grades[componentType];
        if (gradeValue === null || gradeValue === undefined) continue;

        // Upsert grade
        const { error: gradeError } = await supabase
          .from("grades")
          .upsert({
            assignment_id: assignment.id,
            student_id: student.student_id,
            points_earned: gradeValue,
            component_type: componentType,
            semester: semester,
            academic_year_id: academic_year_id,
            graded_by: session.userId,
            graded_at: new Date().toISOString(),
          }, {
            onConflict: 'assignment_id,student_id'
          });

        if (gradeError) {
          errors.push(`Error saving ${componentType} for student ${student.student_id}: ${gradeError.message}`);
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
