import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { userService } from '@/lib/services/userService';
import { updateUserSchema } from '@/lib/schemas';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories/UserRepository';

const updateTeacherSchema = updateUserSchema.omit({ role: true, id: true });

async function getTeacher(id: string) {
  const repository = new UserRepository(createServiceClient());
  const profile = await repository.findById(id);
  if (!profile || profile.role !== 'teacher') {
    throw new NotFoundError('Không tìm thấy giáo viên');
  }
  return { repository };
}

/**
 * PUT /api/teachers/[id] - Update teacher
 */
export const PUT = createApiHandler(
  {
    permission: 'users.edit',
    bodySchema: updateTeacherSchema,
  },
  async ({ body, params }) => {
    const id = params.id as string;
    await getTeacher(id);
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
  async ({ params, user }) => {
    const id = params.id as string;
    if (id === user.id) {
      throw new AuthorizationError('Bạn không thể khóa tài khoản đang sử dụng');
    }
    const { repository } = await getTeacher(id);
    await repository.update(id, { is_active: false } as any);
    return apiSuccess(null, { message: 'Giáo viên đã được xóa' });
  }
);
