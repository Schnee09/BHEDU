import { AttendanceStatus } from "@/lib/attendance/types";
import { apiSuccess, createApiHandler } from "@/lib/api/apiHandler";
import { attendanceService } from "@/lib/services/attendanceService";
import { z } from "zod";

/**
 * Bulk Attendance Marking API
 * POST /api/attendance/bulk
 */
export const POST = createApiHandler({
  // Use a restrictive permission or role check
  allowedRoles: ["admin", "staff", "teacher", "super_admin", "owner"],
  bodySchema: z.object({
    classId: z.string().uuid(),
    date: z.string(),
    records: z.array(z.object({
      studentId: z.string().uuid(),
      status: z.nativeEnum(AttendanceStatus),
      remarks: z.string().optional(),
    })),
  }),
}, async ({ body, user }) => {
  const result = await attendanceService.bulkMark({
    ...body,
    actorId: user.id,
    actorRole: user.role,
  });

  return apiSuccess(result, { message: "Điểm danh đã được lưu thành công" });
});
