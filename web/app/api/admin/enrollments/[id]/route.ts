import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

  const { supabase } = await getDataClient(request);
    const { id } = await context.params;

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(
          id,
          full_name,
          email,
          status
        ),
        class:classes!enrollments_class_id_fkey(
          id,
          name,
          code,
          grade_level,
          teacher:profiles!classes_teacher_id_fkey(
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Error in GET /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

  const { supabase } = await getDataClient(request);
    const { id } = await context.params;
    const body = await request.json();

    // Only allow updating status and grade (if you want to track grades here)
    const allowedFields = ['status', 'grade', 'notes'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

  const { supabase } = await getDataClient(request);
    const { id } = await context.params;

    // Check if enrollment exists and get student_id, class_id for deletion checks
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, status, student_id, class_id')
      .eq('id', id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Check if there are attendance records or grades
    // Note: attendance table has student_id and class_id, not enrollment_id
    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', enrollment.student_id)
      .eq('class_id', enrollment.class_id);

    // Note: grades table may have enrollment_id or student_id
    const { count: gradesCount } = await supabase
      .from('grades')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', enrollment.student_id);

    if ((attendanceCount && attendanceCount > 0) || (gradesCount && gradesCount > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete enrollment with existing attendance or grade records. Consider changing the status to "withdrawn" instead.'
        },
        { status: 409 }
      );
    }

    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting enrollment:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/enrollments/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
