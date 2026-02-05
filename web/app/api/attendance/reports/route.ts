import { apiSuccess, createGetHandler } from "@/lib/api/apiHandler";
import { attendanceService } from "@/lib/services/attendanceService";

/**
 * Attendance Reports API
 * GET /api/attendance/reports
 */
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff", "teacher", "super_admin", "owner"] },
  async ({ searchParams, user }) => {
    const filters = {
      classId: searchParams.get("classId"),
      studentId: searchParams.get("studentId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      status: searchParams.get("status"),
      teacherId: user.id,
      isAdmin: ["admin", "staff", "super_admin", "owner"].includes(user.role),
    };

    const report = await attendanceService.getAttendanceReport(filters);

    return apiSuccess(report);
  },
);
