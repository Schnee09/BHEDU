import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { userRoleCodeSchema } from '@/lib/schemas/common';
import {
  assertAssignableCustomRole,
  canAssignUserRoleByHierarchy,
} from '@/lib/auth/roleAssignment';
import { AppError, AuthorizationError } from '@/lib/api/errors';

const invitationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    role: userRoleCodeSchema,
    expires_in_days: z.number().int().min(1).max(30).default(7),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: 'Cần nhập email hoặc số điện thoại',
    path: ['email'],
  });

/**
 * GET /api/admin/invitations - List all invitations
 * Restricted to admin/staff
 */
export const GET = createGetHandler(
  {
    permission: 'users.invite',
  },
  async ({ user }) => {
    const supabase = createServiceClient(); // Use service client for DB access (RLS bypass)

    const { data: invites, error } = await supabase
      .from('user_invitations')
      .select(
        `
            *,
            invited_by:profiles!user_invitations_invited_by_fkey (
                full_name
            )
        `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    const accessByRole = new Map<string, Promise<boolean>>();
    const canAccessRole = (role: string) => {
      const cached = accessByRole.get(role);
      if (cached) return cached;

      const check = (async () => {
        if (!canAssignUserRoleByHierarchy(user.role, role)) return false;
        try {
          await assertAssignableCustomRole({
            serviceClient: supabase,
            actorId: user.id,
            actorRole: user.role,
            requestedRole: role,
          });
          return true;
        } catch (accessError) {
          if (accessError instanceof AppError && [400, 403].includes(accessError.statusCode)) {
            return false;
          }
          throw accessError;
        }
      })();
      accessByRole.set(role, check);
      return check;
    };

    const visibleInvites = (
      await Promise.all(
        (invites || []).map(async (invite) => ({
          invite,
          visible: await canAccessRole(invite.role),
        }))
      )
    )
      .filter(({ visible }) => visible)
      .map(({ invite }) => invite);

    return apiSuccess({ invites: visibleInvites }, {});
  }
);

/**
 * POST /api/admin/invitations - Create a new invitation
 * Restricted to admin/staff
 */
export const POST = createApiHandler(
  {
    permission: 'users.invite',
    bodySchema: invitationSchema,
  },
  async ({ body, user }) => {
    const { email, phone, role, expires_in_days, metadata = {} } = body;
    const supabase = createServiceClient();

    if (!canAssignUserRoleByHierarchy(user.role, role)) {
      throw new AuthorizationError('Bạn không có quyền gửi lời mời với vai trò này');
    }

    await assertAssignableCustomRole({
      serviceClient: supabase,
      actorId: user.id,
      actorRole: user.role,
      requestedRole: role,
    });

    const token = randomUUID();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expires_in_days);

    const { data: invite, error } = await supabase
      .from('user_invitations')
      .insert({
        email: email || null,
        phone: phone || null,
        role,
        token,
        invited_by: user.id,
        expires_at: expires_at.toISOString(),
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return apiSuccess(
      { invite },
      {
        message: 'Lời mời đã được tạo thành công',
      }
    );
  }
);
