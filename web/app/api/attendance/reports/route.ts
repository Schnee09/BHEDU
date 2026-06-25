import { apiSuccess, createGetHandler } from '@/lib/api/apiHandler';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Attendance Reports API
 * GET /api/attendance/reports
 */
export const GET = createGetHandler(
  { allowedRoles: ['admin', 'teacher', 'super_admin', 'owner', 'student'] },
  async ({ searchParams, user }) => {
    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const filters: any = {
      class_id: searchParams.get('classId') || undefined,
      student_id: searchParams.get('studentId') || undefined,
      from_date: searchParams.get('from_date') || searchParams.get('startDate') || undefined,
      to_date: searchParams.get('to_date') || searchParams.get('endDate') || undefined,
      status: (searchParams.get('status') as any) || undefined,
    };

    // Force personal scoping for students
    if (user.role === 'student') {
      filters.student_id = user.id;
    }

    const report = await repository.findAll(filters);

    return apiSuccess(report);
  }
);
