import { apiSuccess, createApiHandler } from "@/lib/api/apiHandler";
import { userService } from "@/lib/services/userService";
import { updateUserSchema } from "@/lib/schemas";

/**
 * PUT /api/tutors/[id] - Update tutor
 * We can use userService.updateUser which already handles teacher details
 */
export const PUT = createApiHandler({
  permission: "users.edit",
  bodySchema: updateUserSchema,
}, async ({ body, params }) => {
  const updated = await userService.updateUser(params.id, body);
  return apiSuccess(updated, { message: "Gia sư đã được cập nhật" });
});

/**
 * DELETE /api/tutors/[id] - Delete tutor
 */
export const DELETE = createApiHandler({
  permission: "users.delete",
}, async ({ params }) => {
  await userService.deleteUser(params.id);
  return apiSuccess(null, { message: "Gia sư đã được xóa" });
});
