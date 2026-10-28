/**
 * Get Class Attendance API
 * GET /api/attendance/class/[classId]?date=YYYY-MM-DD
 *
 * Get attendance records for all students in a class on a specific date
 */

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createGetHandler, AppError, apiSuccess } from '@/lib/api';
import { getCurrentDateOnly, isValidDateOnly } from '@/lib/enrollments/effectiveDates';
import { canAccessClass } from '@/lib/auth/classAccess';

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user, params }) => {
  try {
    const supabase = createServiceClient();
    const { classId } = (await params) as { classId: string };
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || getCurrentDateOnly();
    if (!isValidDateOnly(date)) {
      throw new AppError('Date must use a valid YYYY-MM-DD format', 400, 'VALIDATION_ERROR');
    }

    const hasClassAccess =
      user.role === 'staff' ||
      (await canAccessClass(supabase, { id: user.id, role: user.role }, classId));
    if (!hasClassAccess) {
      throw new AppError(
        'You do not have permission to view attendance for this class',
        403,
        'FORBIDDEN'
      );
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
          enrollment_date,
          end_date,
          profiles!student_id (
            id,
            full_name,
            email,
            student_code
          )
        `
      )
      .eq('class_id', classId)
      .lte('enrollment_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
      .is('deleted_at', null);

    if (enrollError) {
      logger.error('Failed to fetch enrollments', new Error(enrollError.message));
      // Do not leak internal db message (enrollError.message) to client
      throw new AppError('Failed to fetch class enrollments', 500, 'INTERNAL_SERVER_ERROR');
    }

    // Get attendance records for this date
    const { data: attendance } = await supabase
      .from('attendance')
      .select(
        `student_id, status, remarks, enrollment_exception_reason,
         profiles!student_id (id, full_name, email, student_code)`
      )
      .eq('class_id', classId)
      .eq('date', date)
      .is('deleted_at', null);

    // Combine enrollment and attendance data
    const attendanceMap = new Map(attendance?.map((a) => [a.student_id, a]) || []);

    const records = (enrollments || []).map((enrollment: any) => ({
      studentId: enrollment.student_id,
      studentName: enrollment.profiles?.full_name || 'Unknown',
      studentCode: enrollment.profiles?.student_code || enrollment.profiles?.id || '',
      email: enrollment.profiles?.email || '',
      status: attendanceMap.get(enrollment.student_id)?.status || 'unmarked',
      remarks: (attendanceMap.get(enrollment.student_id) as any)?.remarks || '',
      enrollmentExceptionReason: null,
    }));

    const enrolledStudentIds = new Set(records.map((record) => record.studentId));
    for (const record of attendance || []) {
      if (!record.enrollment_exception_reason || enrolledStudentIds.has(record.student_id))
        continue;
      const profile = record.profiles as any;
      records.push({
        studentId: record.student_id,
        studentName: profile?.full_name || 'Không rõ tên',
        studentCode: profile?.student_code || profile?.id || '',
        email: profile?.email || '',
        status: record.status,
        remarks: record.remarks || '',
        enrollmentExceptionReason: record.enrollment_exception_reason,
      });
    }

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
