/**
 * Class Enrollments API
 * POST /api/classes/[classId]/enrollments - Enroll students
 * DELETE /api/classes/[classId]/enrollments - Remove enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';

// Enroll students in a class
export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const authResult = await teacherAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { classId } = await params;
    const body = await req.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
    }

    // Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Create enrollment records (skip duplicates)
    const enrollments = studentIds.map((studentId) => ({
      student_id: studentId,
      class_id: classId,
      status: 'enrolled',
      enrollment_date: new Date().toISOString().split('T')[0],
    }));

    // Insert one by one to handle duplicates gracefully
    let successCount = 0;
    const errors: string[] = [];

    for (const enrollment of enrollments) {
      const { error } = await supabase
        .from('enrollments')
        .upsert(enrollment, { onConflict: 'student_id,class_id' });

      if (error) {
        errors.push(error.message);
        console.error(`[Enrollment] Failed to enroll student ${enrollment.student_id}:`, error);
      } else {
        successCount++;
      }
    }

    if (successCount === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Lỗi ghi danh: ${errors[0]}`,
          errors: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        successCount > 0
          ? `Đã ghi danh ${successCount} học sinh vào ${classData.name}`
          : 'Không có học sinh nào được ghi danh (có thể đã được ghi danh trước đó)',
      enrolled: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Enroll students error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Remove student enrollment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await teacherAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { classId } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId query parameter is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) {
      logger.error('Failed to remove enrollment', new Error(error.message));
      return NextResponse.json(
        { error: 'Failed to remove enrollment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student removed from class',
    });
  } catch (error) {
    logger.error('Remove enrollment error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Get enrollments for a class
export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const authResult = await teacherAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { classId } = await params;

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        status,
        enrollment_date,
        profiles:student_id (
          id,
          full_name,
          email,
          student_code,
          grade_level
        )
      `
      )
      .eq('class_id', classId);
    // Removed active-only filter to show all enrollments

    if (error) {
      logger.error('Failed to fetch enrollments', new Error(error.message));
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: error.message },
        { status: 500 }
      );
    }

    // Flatten the response
    const students = (enrollments || []).map((e) => {
      const profile = (e.profiles as any) || {};
      return {
        ...profile,
        enrollment_id: e.id,
        student_id: e.student_id,
        enrollment_date: e.enrollment_date,
        status: e.status || 'enrolled', // Ensure enrollment status wins
      };
    });

    return NextResponse.json({
      success: true,
      data: students,
      enrollments: students,
    });
  } catch (error) {
    logger.error('Get enrollments error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
