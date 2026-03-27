/**
 * Get Class Attendance API
 * GET /api/attendance/class/[classId]?date=YYYY-MM-DD
 *
 * Get attendance records for all students in a class on a specific date
 */

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createGetHandler, AppError, apiSuccess } from '@/lib/api';

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user, params }) => {
  try {
    const supabase = createServiceClient();
    const { classId } = (await params) as { classId: string };
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Verify teacher has access to this class
    // Admins, Staff and higher see everything
    const isAdminLike = ['admin', 'staff', 'super_admin', 'owner'].includes(user.role || '');

    if (!isAdminLike) {
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .eq('teacher_id', user.id)
        .single();

      if (!classData) {
        throw new AppError(
          'You do not have permission to view attendance for this class',
          403,
          'FORBIDDEN'
        );
      }
    }

    // Get class info
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', classId)
      .single();

    if (classError || !classInfo) {
      throw new AppError('Class not found', 404, 'NOT_FOUND');
    }

    // Get students enrolled in the class with joins
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(
        `
          student_id,
          profiles!student_id (
            id,
            full_name,
            email,
            student_code
          )
        `
      )
      .eq('class_id', classId);

    if (enrollError) {
      logger.error('Failed to fetch enrollments', new Error(enrollError.message));
      // Do not leak internal db message (enrollError.message) to client
      throw new AppError('Failed to fetch class enrollments', 500, 'INTERNAL_SERVER_ERROR');
    }

    // Get attendance records for this date
    const { data: attendance } = await supabase
      .from('attendance')
      .select('student_id, status, remarks')
      .eq('class_id', classId)
      .eq('date', date);

    // Combine enrollment and attendance data
    const attendanceMap = new Map(attendance?.map((a) => [a.student_id, a]) || []);

    const records = (enrollments || []).map((enrollment: any) => ({
      studentId: enrollment.student_id,
      studentName: enrollment.profiles?.full_name || 'Unknown',
      studentCode: enrollment.profiles?.student_code || enrollment.profiles?.id || '',
      email: enrollment.profiles?.email || '',
      status: attendanceMap.get(enrollment.student_id)?.status || 'unmarked',
      remarks: (attendanceMap.get(enrollment.student_id) as any)?.remarks || '',
    }));

    // Calculate summary statistics
    const summary = {
      totalStudents: records.length,
      presentCount: records.filter((r) => r.status === 'present').length,
      absentCount: records.filter((r) => r.status === 'absent').length,
      unmarkedCount: records.filter((r) => r.status === 'unmarked').length,
      attendanceRate: 0,
    };

    summary.attendanceRate =
      summary.totalStudents > 0
        ? Math.round((summary.presentCount / summary.totalStudents) * 100 * 100) / 100
        : 0;

    return apiSuccess({
      class: classInfo,
      date,
      summary,
      students: records,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get class attendance error', error);
    throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR');
  }
});
