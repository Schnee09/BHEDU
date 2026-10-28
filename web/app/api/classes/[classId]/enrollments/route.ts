/**
 * Class Enrollments API
 * POST /api/classes/[classId]/enrollments - Enroll students
 * DELETE /api/classes/[classId]/enrollments - Remove enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';
import { canAccessClass } from '@/lib/auth/classAccess';

// Enroll students in a class
export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const authResult = await adminAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { classId } = await params;
    const body = await req.json();
    const { studentIds } = body;
    const enrollmentDate = body.enrollment_date || new Date().toISOString().slice(0, 10);

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

    const { data, error: enrollmentError } = await supabase.rpc('enroll_students_batch_atomic', {
      p_student_ids: studentIds,
      p_class_id: classId,
      p_enrollment_date: enrollmentDate,
      p_notes: body.notes || null,
      p_actor_id: authResult.userId,
    });

    if (enrollmentError) {
      return NextResponse.json(
        {
          success: false,
          message: `Không thể ghi danh danh sách: ${enrollmentError.message}`,
          error: enrollmentError.message,
        },
        { status: 400 }
      );
    }

    const successCount = Array.isArray(data) ? data.length : studentIds.length;

    return NextResponse.json({
      success: true,
      message:
        successCount > 0
          ? `Đã ghi danh ${successCount} học sinh vào ${classData.name}`
          : 'Không có học sinh nào được ghi danh',
      enrolled: successCount,
      enrollments: data || [],
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

// End a student enrollment without deleting its history.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await adminAuth(req);
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

    const { data: enrollment, error: findError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'enrolled')
      .is('deleted_at', null)
      .maybeSingle();

    if (findError) {
      logger.error('Failed to find enrollment', new Error(findError.message));
      return NextResponse.json(
        { error: 'Failed to find enrollment', details: findError.message },
        { status: 500 }
      );
    }
    if (!enrollment) {
      return NextResponse.json({ error: 'Active enrollment not found' }, { status: 404 });
    }

    const { error } = await supabase.rpc('end_enrollment_atomic', {
      p_enrollment_id: enrollment.id,
      p_end_date: new Date().toISOString().split('T')[0],
      p_status: 'withdrawn',
      p_reason: 'Kết thúc từ trang quản lý ghi danh lớp',
      p_actor_id: authResult.userId,
    });

    if (error) {
      logger.error('Failed to end enrollment', new Error(error.message));
      return NextResponse.json(
        { error: 'Failed to end enrollment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student enrollment ended',
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

    const canViewClass = await canAccessClass(
      supabase,
      { id: authResult.userId, role: authResult.userRole },
      classId
    );
    if (!canViewClass) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      .eq('class_id', classId)
      .is('deleted_at', null);
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
