import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { userService } from '@/lib/services/userService';
import { updateUserSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';
import { createAbility } from '@/lib/auth/permissions';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { getAuthContext } from '@/lib/auth/guard';

const PROTECTED_ROLES = new Set(['owner', 'super_admin']);

function assertCanMutateRole(actorRole: string, targetRole: string, requestedRole?: string) {
  if (actorRole !== 'super_admin' && PROTECTED_ROLES.has(targetRole)) {
    throw new AuthorizationError('Chỉ quản trị viên cấp cao mới có thể thay đổi tài khoản này');
  }

  if (actorRole !== 'super_admin' && requestedRole && PROTECTED_ROLES.has(requestedRole)) {
    throw new AuthorizationError('Bạn không có quyền cấp vai trò quản trị cấp cao');
  }
}

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export const GET = createGetHandler<{ id: string }>(
  { permission: 'users.view' },
  async ({ params, user }) => {
    const contextUser = user;
    const ability = createAbility({
      userId: contextUser.id,
      role: contextUser.role,
    });

    if (ability.cannot('read', 'User')) {
      // TODO: Check specific user resource
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const repository = new UserRepository(supabase);
    const userProfile = await repository.findById(params.id);

    if (!userProfile) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    // Explicitly allow reading this user?
    // In strict CASL, we'd check ability.can('read', userProfile)
    // For Admin API, 'read' 'User' implies list/detail access.

    return apiSuccess(userProfile);
  }
);

/**
 * PUT /api/admin/users/[id]
 * Update user
 */
export const PUT = createApiHandler(
  {
    permission: 'users.edit',
    bodySchema: updateUserSchema,
  },
  async ({ body, params, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot('update', 'User')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new UserRepository(supabase);
    const target = await repository.findById(id);
    if (!target) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    assertCanMutateRole(user.role, target.role, body.role);

    // Use UserService for complex update (syncs with other tables)
    const updatedUser = await userService.updateUser(id, body);
    return apiSuccess(updatedUser, {
      message: 'Cập nhật người dùng thành công',
    });
  }
);

/**
 * DELETE /api/admin/users/[id]
 * Delete or deactivate user
 */
export const DELETE = createApiHandler<{ id: string }>(
  { permission: 'users.delete' },
  async ({ params, request, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot('delete', 'User')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    const id = params.id as string;
    if (id === user.id) {
      throw new AuthorizationError('Bạn không thể xóa hoặc khóa tài khoản đang sử dụng');
    }

    const supabase = createServiceClient();
    const repository = new UserRepository(supabase);
    const target = await repository.findById(id);
    if (!target) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    assertCanMutateRole(user.role, target.role);

    if (permanent) {
      const hardDeleteAuth = await getAuthContext(request, 'users.delete.hard');
      if (!hardDeleteAuth.authorized) {
        throw new AuthorizationError('Bạn không có quyền xóa vĩnh viễn tài khoản');
      }
      await userService.deleteUser(id);
      return apiSuccess(null, { message: 'Người dùng đã bị xóa vĩnh viễn' });
    } else {
      // Soft delete
      // We use base update for simple status change
      await repository.update(id, { is_active: false } as any);
      // Cast as any because UpdateUserInput might not strictly match just {is_active} if strict?
      // Actually UpdateUserInput has is_active: boolean optional. So it should match.

      return apiSuccess(null, { message: 'Người dùng đã bị tạm khóa' });
    }
  }
);
