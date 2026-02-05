import { apiSuccess, createGetHandler } from "@/lib/api/apiHandler";
import { AttendanceRepository } from "@/lib/repositories/AttendanceRepository";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Attendance Reports API
 * GET /api/attendance/reports
 */
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff", "teacher", "super_admin", "owner"] },
  async ({ searchParams, user }) => {
    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const filters = {
      class_id: searchParams.get("classId") || undefined,
      student_id: searchParams.get("studentId") || undefined,
      from_date: searchParams.get("startDate") || undefined,
      to_date: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") as any || undefined,
    };

    const report = await repository.findAll(filters);

    return apiSuccess(report);
  },
);
