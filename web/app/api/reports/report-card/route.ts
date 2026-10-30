import { apiSuccess, createGetHandler } from '@/lib/api';
import { gradeService, studentService } from '@/lib/services';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/api/errors';
import { canAccessStudent } from '@/lib/auth/classAccess';

export const dynamic = 'force-dynamic';

/**
 * Report Card API
 * GET /api/reports/report-card
 *
 * Aggregates student, grade, and attendance data for a printable report card
 */
export const GET = createGetHandler({ requireAuth: true }, async ({ searchParams, user }) => {
  const studentId = searchParams.get('studentId') || (user.role === 'student' ? user.id : null);
  const academicYearId = searchParams.get('academicYearId');

  if (!studentId) {
    throw new NotFoundError('studentId is required');
  }

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
    attendanceRepo.findAll({ student_id: studentId }),
  ]);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Simple attendance summary
  const attendanceRecords = attendance.data;
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a: any) =>
    ['present', 'late'].includes(a.status)
  ).length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

  return apiSuccess({
    student,
    transcript,
    attendanceSummary: {
      totalDays,
      presentDays,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    },
  });
});
