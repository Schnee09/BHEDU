import { apiSuccess, createGetHandler } from '@/lib/api/apiHandler';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';
import { AuthorizationError, ValidationError } from '@/lib/api/errors';

/**
 * Attendance Reports API
 * GET /api/attendance/reports
 */
export const GET = createGetHandler(
  { permission: 'attendance.view' },
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

    const isManagement = ['admin', 'owner', 'super_admin'].includes(user.role);
    if (!isManagement && user.role !== 'student') {
      if (!filters.class_id) {
        throw new ValidationError('classId is required for class-scoped attendance reports');
      }

      const allowed = await canAccessClass(
        supabase,
        { id: user.id, role: user.role },
        filters.class_id
      );
      if (!allowed) {
        throw new AuthorizationError('You are not assigned to this class');
      }
    }

    const report = await repository.findAll(filters);

    return apiSuccess(report);
  }
);
