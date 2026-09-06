import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { userService } from '@/lib/services/userService';
import { updateUserSchema } from '@/lib/schemas';

/**
 * PUT /api/teachers/[id] - Update teacher
 */
export const PUT = createApiHandler(
  {
    permission: 'users.edit',
    bodySchema: updateUserSchema,
  },
  async ({ body, params }) => {
    const id = params.id as string;
    const updated = await userService.updateUser(id, body);
    return apiSuccess(updated, { message: 'Giáo viên đã được cập nhật' });
  }
);

/**
 * DELETE /api/teachers/[id] - Delete teacher
 */
export const DELETE = createApiHandler(
  {
    permission: 'users.delete',
  },
  async ({ params }) => {
    const id = params.id as string;
    await userService.deleteUser(id);
    return apiSuccess(null, { message: 'Giáo viên đã được xóa' });
  }
);
