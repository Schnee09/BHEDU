/**
 * Get Class Students API
 * GET /api/classes/[classId]/students
 *
 * Get all students enrolled in a specific class via enrollments table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { classId } = await params;

    // Get enrolled students from enrollments table (primary and only source)
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        status,
        enrollment_date,
        profiles:student_id (
          id,
          email,
          full_name,
          student_code,
          grade_level
        )
      `
      )
      .eq('class_id', classId);
    // Note: Include all statuses, not just active - let frontend filter if needed

    if (enrollError) {
      logger.error('Failed to fetch enrollments', {
        error: enrollError.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch students', details: enrollError.message },
        { status: 500 }
      );
    }

    // Flatten the response for frontend compatibility ensuring student UUID is preserved
    const students = (enrollments || [])
      .map((e) => {
        const profile = (e.profiles as any) || {};
        const studentUuid = e.student_id || profile.id;
        return {
          id: studentUuid,
          student_id: studentUuid,
          user_id: studentUuid,
          enrollment_id: e.id,
          enrollment_date: e.enrollment_date,
          status: e.status || 'enrolled',
          full_name: profile.full_name,
          email: profile.email,
          student_code: profile.student_code,
          grade_level: profile.grade_level,
          cid: profile.student_id || null,
        };
      })
      .filter((s) => s.full_name && s.id);

    return NextResponse.json({
      success: true,
      data: students,
      students: students,
      count: students.length,
    });
  } catch (error) {
    logger.error('Get class students error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
