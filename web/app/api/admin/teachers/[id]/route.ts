import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { teacherService } from "@/lib/services/teacherService";
import { userService } from "@/lib/services/userService";
import { updateProfileSchema } from "@/lib/schemas";
import { NotFoundError } from "@/lib/api/errors";
import { createServiceClient } from "@/lib/supabase/server";
import { TeacherRepository } from "@/lib/repositories/TeacherRepository";

/**
 * GET /api/admin/teachers/[id]
 * Standardized teacher details with history
 */
export const GET = createGetHandler(
  { permission: "users.view" },
  async ({ params, user }) => {
    const id = params.id;
    const supabase = createServiceClient();
    const repository = new TeacherRepository(supabase);

    const detail = await repository.findDetailById(id);

    if (!detail) {
      throw new NotFoundError("Teacher not found");
    }

    return apiSuccess(detail, {
      // Compatibility wrapper
      teacher: detail,
    });
  },
);

/**
 * PATCH /api/admin/teachers/[id]
 * Standardized update
 */
export const PATCH = createApiHandler(
  {
    permission: "users.edit",
    bodySchema: updateProfileSchema.partial(),
  },
  async ({ params, body, user: actor }) => {
    const id = params.id;

    // Use centralized UserService for profile updates
    const updated = await userService.updateProfile(id, body);

    return apiSuccess(updated, {
      message: "Thông tin giáo viên đã được cập nhật thành công.",
    });
  },
);

/**
 * DELETE /api/admin/teachers/[id]
 * Standardized deactivation
 */
export const DELETE = createApiHandler(
  { permission: "users.delete" },
  async ({ params, user: actor }) => {
    const id = params.id;
    const supabase = createServiceClient();

    // Check for active assignments before deactivating
    const { count: activeClasses } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id)
      .eq("status", "active");

    if (activeClasses && activeClasses > 0) {
      return apiSuccess({
        success: false,
        error:
          `Không thể vô hiệu hóa giáo viên đang có ${activeClasses} lớp học đang hoạt động.`,
      }, { _status: 409 });
    }

    // Standardized inactivation status
    await supabase
      .from("profiles")
      .update({ is_active: false, status: "inactive" })
      .eq("id", id);

    return apiSuccess(null, {
      message: "Giáo viên đã được vô hiệu hóa thành công.",
    });
  },
);
