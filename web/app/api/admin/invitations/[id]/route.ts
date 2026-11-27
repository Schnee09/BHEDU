import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/lib/api/errors';
import {
  assertAssignableCustomRole,
  canAssignUserRoleByHierarchy,
} from '@/lib/auth/roleAssignment';
import { uuidSchema } from '@/lib/schemas/common';
import { createServiceClient } from '@/lib/supabase/server';

/** DELETE /api/admin/invitations/[id] - Revoke an unused invitation. */
export const DELETE = createApiHandler<{ id: string }>(
  { permission: 'users.invite' },
  async ({ params, user }) => {
    const parsedId = uuidSchema.safeParse(params.id);
    if (!parsedId.success) {
      throw new ValidationError('Mã lời mời không hợp lệ');
    }

    const supabase = createServiceClient();
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('id, role, used_at')
      .eq('id', parsedId.data)
      .maybeSingle();

    if (invitationError) throw invitationError;
    if (!invitation) throw new NotFoundError('Không tìm thấy lời mời');
    if (!canAssignUserRoleByHierarchy(user.role, invitation.role)) {
      throw new AuthorizationError('Bạn không có quyền thu hồi lời mời này');
    }

    await assertAssignableCustomRole({
      serviceClient: supabase,
      actorId: user.id,
      actorRole: user.role,
      requestedRole: invitation.role,
    });

    if (invitation.used_at) {
      throw new ConflictError('Không thể thu hồi lời mời đã được sử dụng');
    }

    const { error: deleteError } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', parsedId.data);
    if (deleteError) throw deleteError;

    return apiSuccess(null, { message: 'Đã thu hồi lời mời' });
  }
);
