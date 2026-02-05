import { AttendanceStatus } from "@/lib/attendance/types";
import { apiSuccess, createApiHandler } from "@/lib/api/apiHandler";
import { AttendanceRepository } from "@/lib/repositories/AttendanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
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
  const supabase = createServiceClient();
  const repository = new AttendanceRepository(supabase);

  const result = await repository.createBulk({
    class_id: body.classId,
    date: body.date,
    records: body.records.map((r) => ({
      student_id: r.studentId,
      status: r.status,
      notes: r.remarks,
    })),
    marked_by: user.id,
  });

  return apiSuccess(result, { message: "Điểm danh đã được lưu thành công" });
});
