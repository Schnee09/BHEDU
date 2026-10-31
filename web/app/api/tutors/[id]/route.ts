import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { userService } from '@/lib/services/userService';
import { updateUserSchema } from '@/lib/schemas';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories/UserRepository';

const updateTutorSchema = updateUserSchema.omit({ role: true, id: true });

async function getTutor(id: string) {
  const repository = new UserRepository(createServiceClient());
  const profile = await repository.findById(id);
  if (!profile || profile.role !== 'tutor') {
    throw new NotFoundError('Không tìm thấy giáo viên học kèm');
  }
  return { repository };
}

/**
 * PUT /api/tutors/[id] - Update tutor
 * We can use userService.updateUser which already handles teacher details
 */
export const PUT = createApiHandler(
  {
    permission: 'users.edit',
    bodySchema: updateTutorSchema,
  },
  async ({ body, params }) => {
    const id = params.id as string;
    await getTutor(id);
    const updated = await userService.updateUser(id, body);
    return apiSuccess(updated, { message: 'Gia sư đã được cập nhật' });
  }
);

/**
 * DELETE /api/tutors/[id] - Delete tutor
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
    const { repository } = await getTutor(id);
    await repository.update(id, { is_active: false } as any);
    return apiSuccess(null, { message: 'Gia sư đã được xóa' });
  }
);
