import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * GET /api/grades/conduct-entry
 * Fetch students with their conduct grades for a specific class and semester
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize (teachers and admins only)
    const authResult = await adminAuth(request);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is teacher or admin
    if (authResult.userRole !== 'admin' && authResult.userRole !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Teacher or admin role required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const semester = searchParams.get('semester');
    const academicYearId = searchParams.get('academic_year_id');

    if (!classId || !semester || !academicYearId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get enrolled students in the class
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        profiles:student_id (
          id,
          full_name,
          student_code
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
      });
    }

    const studentIds = enrollments.map((e) => e.student_id);

    // Get existing conduct grades
    const { data: conductGrades, error: conductError } = await supabase
      .from('conduct_grades')
      .select('*')
      .in('student_id', studentIds)
      .eq('semester', semester)
      .eq('academic_year_id', academicYearId);

    if (conductError) {
      console.error('Error fetching conduct grades:', conductError);
    }

    // Map conduct grades to students
    const conductGradeMap = new Map(
      (conductGrades || []).map((cg) => [cg.student_id, cg])
    );

    const students = enrollments
      .map((enrollment: any) => {
        const student = enrollment.profiles;
        if (!student) return null;

        const conductGrade = conductGradeMap.get(student.id);

        return {
          id: student.id,
          student_code: student.student_code,
          full_name: student.full_name,
          conduct_grade: conductGrade?.conduct_grade || null,
          teacher_comment: conductGrade?.teacher_comment || null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort by student code or name
        if (a.student_code && b.student_code) {
          return a.student_code.localeCompare(b.student_code);
        }
        return a.full_name.localeCompare(b.full_name);
      });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error: any) {
    console.error('Error in conduct-entry GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/grades/conduct-entry
 * Save/update conduct grades for multiple students
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize (teachers and admins only)
    const authResult = await adminAuth(request);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is teacher or admin
    if (authResult.userRole !== 'admin' && authResult.userRole !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Teacher or admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { conductGrades } = body;

    if (!conductGrades || !Array.isArray(conductGrades)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conduct grades data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Filter out entries without conduct_grade (not yet evaluated)
    const validGrades = conductGrades.filter((cg) => cg.conduct_grade);

    if (validGrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No grades to save',
      });
    }

    // Prepare data for upsert
    const upsertData = validGrades.map((cg) => ({
      student_id: cg.student_id,
      semester: cg.semester,
      academic_year_id: cg.academic_year_id,
      conduct_grade: cg.conduct_grade,
      teacher_comment: cg.teacher_comment || null,
      evaluated_by: authResult.userId,
      evaluated_at: new Date().toISOString(),
    }));

    // Upsert conduct grades (insert or update if exists)
    const { data, error } = await supabase
      .from('conduct_grades')
      .upsert(upsertData, {
        onConflict: 'student_id,semester,academic_year_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error upserting conduct grades:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save conduct grades' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${data?.length || 0} conduct grades`,
      data,
    });
  } catch (error: any) {
    console.error('Error in conduct-entry POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
