import { apiSuccess, createApiHandler } from "@/lib/api/apiHandler";
import { enrollmentService } from "@/lib/services/enrollmentService";

/**
 * Single Enrollment API
 * DELETE /api/enrollments/[id] - Remove enrollment
 */
export const DELETE = createApiHandler(
  { permission: "enrollments.manage" },
  async ({ params }) => {
    const { id } = params;
    await enrollmentService.deleteEnrollment(id);
    return apiSuccess({ message: "Đã hủy ghi danh" });
  },
);
