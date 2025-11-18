import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { createClientFromRequest } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Check admin authentication
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createClientFromRequest(request as any);
    const body = await request.json();
    const { class_id, student_id, status = 'enrolled' } = body;

    // Validate required fields
    if (!class_id || !student_id) {
      return NextResponse.json(
        { success: false, error: 'Class ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Check if class exists and get max_students
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, max_students, enrollments:enrollments(count)')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class is full
    const currentEnrollments = classData.enrollments?.[0]?.count || 0;
    if (classData.max_students && currentEnrollments >= classData.max_students) {
      return NextResponse.json(
        { success: false, error: 'Class is full' },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: studentData, error: studentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', student_id)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    if (studentData.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'User is not a student' },
        { status: 400 }
      );
    }

    // Check if student is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('class_id', class_id)
      .eq('student_id', student_id)
      .single();

    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled') {
        return NextResponse.json(
          { success: false, error: 'Student is already enrolled in this class' },
          { status: 400 }
        );
      } else {
        // Re-enroll by updating the existing enrollment
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from('enrollments')
          .update({
            status: 'enrolled',
            enrolled_at: new Date().toISOString()
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error re-enrolling student:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to re-enroll student' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          enrollment: updatedEnrollment
        });
      }
    }

    // Create new enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        class_id,
        student_id,
        status,
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Failed to enroll student' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Error in POST /api/admin/enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check admin authentication
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createClientFromRequest(request as any);
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const classId = searchParams.get('class_id');
    const studentId = searchParams.get('student_id');
    const status = searchParams.get('status');
    const academicYearId = searchParams.get('academic_year_id');

    // Build query
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(
          id,
          first_name,
          last_name,
          email,
          student_number,
          status
        ),
        class:classes!enrollments_class_id_fkey(
          id,
          name,
          code,
          grade_level,
          academic_year_id
        )
      `)
      .order('enrolled_at', { ascending: false });

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (academicYearId) {
      query = query.eq('class.academic_year_id', academicYearId);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollments
    });
  } catch (error) {
    console.error('Error in GET /api/admin/enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
