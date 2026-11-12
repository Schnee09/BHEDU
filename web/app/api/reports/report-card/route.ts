import { apiSuccess, createGetHandler } from '@/lib/api';
import { gradeService, studentService } from '@/lib/services';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/api/errors';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { reportCardQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';
import { calculateAttendanceRate } from '@/lib/attendance/rate';

export const dynamic = 'force-dynamic';

/**
 * Report Card API
 * GET /api/reports/report-card
 *
 * Aggregates student, grade, and attendance data for a printable report card
 */
export const GET = createGetHandler({ requireAuth: true }, async ({ request, user }) => {
  const { studentId, academicYearId, dateFrom, dateTo } = validateQuery(
    request,
    reportCardQuerySchema
  );

  const supabase = createServiceClient();
  const allowed = await canAccessStudent(supabase, { id: user.id, role: user.role }, studentId);
  if (!allowed) {
    return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const attendanceRepo = new AttendanceRepository(supabase);

  // Fetch data in parallel
  const [student, transcript, attendance] = await Promise.all([
    studentService.getStudentById(studentId),
    gradeService.getStudentTranscript(studentId, academicYearId || undefined),
    attendanceRepo.findByStudent(studentId, { from_date: dateFrom, to_date: dateTo }),
  ]);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Simple attendance summary
  const attendanceRecords = attendance;
  const totalDays = attendanceRecords.length;
  const statuses = attendanceRecords.map((record) => record.status);
  const presentDays = statuses.filter((status) => ['present', 'late'].includes(status)).length;
  const attendanceRate = calculateAttendanceRate(statuses, 1);

  return apiSuccess({
    student,
    transcript,
    attendanceSummary: {
      totalDays,
      presentDays,
      attendanceRate,
    },
  });
});
