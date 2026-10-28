/**
 * Class Enrollments API
 * GET /api/classes/[classId]/enrollments - Read the complete class history.
 * Mutations use /api/enrollments so permissions and lifecycle audit stay unified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';
import { canAccessClass } from '@/lib/auth/classAccess';

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
