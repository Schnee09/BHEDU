import { NextResponse } from "next/server";
import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { userService } from "@/lib/services/userService";
import { updateUserSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { NotFoundError } from "@/lib/api/errors";

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export const GET = createGetHandler<{ id: string }>(
  { requireAuth: true },
  async ({ params, user }) => {
    const contextUser = user;
    const ability = createAbility({
      userId: contextUser.id,
      role: contextUser.role,
    });

    if (ability.cannot("read", "User")) { // TODO: Check specific user resource
       return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();
    const repository = new UserRepository(supabase);
    const userProfile = await repository.findById(params.id);

    if (!userProfile) {
      throw new NotFoundError("Không tìm thấy người dùng");
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
export const PUT = createApiHandler<{ id: string }>(
  {
    requireAuth: true,
    bodySchema: updateUserSchema,
  },
  async ({ body, params, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    // We can fetch the subject first to check permissions, 
    // but updateUserSchema already validates ID? 
    // params.id is the target.
    
    // Simplistic check for now
    if (ability.cannot("update", "User")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Use UserService for complex update (syncs with other tables)
    const updatedUser = await userService.updateUser(params.id, body);
    return apiSuccess(updatedUser, { message: "Cập nhật người dùng thành công" });
  }
);

/**
 * DELETE /api/admin/users/[id]
 * Delete or deactivate user
 */
export const DELETE = createApiHandler<{ id: string }>(
  { requireAuth: true },
  async ({ params, request, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("delete", "User")) {
       return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      await userService.deleteUser(params.id);
      return apiSuccess(null, { message: "Người dùng đã bị xóa vĩnh viễn" });
    } else {
      // Soft delete
      const supabase = createServiceClient();
      const repository = new UserRepository(supabase);
      
      // We use base update for simple status change
      await repository.update(params.id, { is_active: false } as any); 
      // Cast as any because UpdateUserInput might not strictly match just {is_active} if strict? 
      // Actually UpdateUserInput has is_active: boolean optional. So it should match.

      return apiSuccess(null, { message: "Người dùng đã bị tạm khóa" });
    }
  }
);
