import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createUserSchema, userQuerySchema } from '@/lib/schemas';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { validateQuery } from '@/lib/api/validation';
import { userService } from '@/lib/services/userService';

/**
 * GET /api/admin/users
 * List all users with filtering and permissions
 */
export const GET = createGetHandler({ permission: 'users.view' }, async ({ request }) => {
  const supabase = createServiceClient();

  const query = validateQuery(request, userQuerySchema);
  const repository = new UserRepository(supabase);

  const result = await repository.findAll(query);
  const stats = await repository.getStatistics();

  return apiPaginated(
    result.data,
    {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    },
    { statistics: stats }
  );
});

/**
 * POST /api/admin/users
 * Create new user
 */
export const POST = createApiHandler(
  {
    permission: 'users.create',
    bodySchema: createUserSchema,
  },
  async ({ body, user }) => {
    // Note: UserService uses supabase-admin internally.
    // We pass current user info for auditing.
    const newUser = await userService.createUser(body, user.role, user.id);

    return apiSuccess(newUser, {
      message: 'Người dùng đã được tạo thành công. Email chào mừng đã được gửi.',
    });
  }
);
