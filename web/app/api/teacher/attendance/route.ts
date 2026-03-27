import { apiSuccess, createGetHandler } from '@/lib/api';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { classService } from '@/lib/services';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Teacher Attendance API
 * GET /api/teacher/attendance
 *
 * Returns attendance records for students in classes taught by the authenticated teacher
 */
export const GET = createGetHandler(
  { allowedRoles: ['teacher'] },
  async ({ user, searchParams }) => {
    // 1. Get classes taught by this teacher to enforce scoping
    const { classes: teacherClasses } = await classService.getClasses({ teacherId: user.id });
    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return apiSuccess([]);
    }

    // 2. Extract and validate requested classId
    const requestedClassId = searchParams.get('classId');
    if (requestedClassId && !classIds.includes(requestedClassId)) {
      return apiSuccess([]); // Requested a class they don't teach
    }

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const filters = {
      class_id: requestedClassId || undefined,
      student_id: searchParams.get('studentId') || undefined,
      from_date: searchParams.get('startDate') || undefined,
      to_date: searchParams.get('endDate') || undefined,
    };

    const result = await repository.findAll(filters);
    const attendanceRecords = result.data;

    // Final safety check: filter result by their classIds if we didn't filter in DB
    const securedRecords = attendanceRecords.filter((r: any) => classIds.includes(r.class_id));

    return apiSuccess(securedRecords);
  }
);
