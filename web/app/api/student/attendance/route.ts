import { apiSuccess, createGetHandler } from '@/lib/api';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Student Attendance API
 * GET /api/student/attendance
 *
 * Returns personal attendance records for the authenticated student
 */
export const GET = createGetHandler(
  { allowedRoles: ['student'] },
  async ({ user, searchParams }) => {
    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const filters = {
      student_id: user.id,
      from_date: searchParams.get('startDate') || undefined,
      to_date: searchParams.get('endDate') || undefined,
    };

    const attendanceRecords = await repository.findAll(filters);

    return apiSuccess(attendanceRecords);
  }
);
