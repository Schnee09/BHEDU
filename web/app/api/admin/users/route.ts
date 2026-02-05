import { NextRequest, NextResponse } from "next/server";
import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import {
  createUserSchema,
  userQuerySchema,
} from "@/lib/schemas";
import { UserRepository } from "@/lib/repositories/UserRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { validateQuery } from "@/lib/api/validation";
import { userService } from "@/lib/services/userService";

/**
 * GET /api/admin/users
 * List all users with filtering and permissions
 */
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user }) => {
    const supabase = createServiceClient();
    const ability = createAbility({
      userId: user.id,
      role: user.role,
      classIds: [], // TODO: enhanced context
    });

    if (ability.cannot("read", "User")) {
       return NextResponse.json(
        { success: false, error: "Bạn không có quyền xem danh sách người dùng" },
        { status: 403 }
      );
    }

    const query = validateQuery(request, userQuerySchema);
    const repository = new UserRepository(supabase);
    
    // Check if user is restricted to specific users (e.g. teacher viewing students)
    // For now, "admin/users" suggests admin API, so "view.users" implies all.
    // If we want detailed filtering (like teacher only sees students), we'd modify query here
    // based on ability. But for Admin users, they see what filters allow.

    const result = await repository.findAll(query);
    const stats = await repository.getStatistics();

    return apiPaginated(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    }, { statistics: stats });
  }
);

/**
 * POST /api/admin/users
 * Create new user
 */
export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: createUserSchema,
  },
  async ({ body, user }) => {
    const ability = createAbility({
       userId: user.id,
       role: user.role,
    });

    // Check general create permission
    if (ability.cannot("create", "User")) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền tạo người dùng" },
        { status: 403 }
      );
    }

    // Role-specific checks (e.g. Staff cannot create Admin)
    // We use CASL subject with role property if ability allows it
    // Or we rely on UserService's internal checks (which are robust).
    // Using UserService logic is safer for now as it handles Supabase Auth Admin complexity.
    
    // Note: UserService uses supabase-admin internally.
    // We pass current user info for auditing.
    const newUser = await userService.createUser(body, user.role, user.id);

    return apiSuccess(newUser, {
      message: "Người dùng đã được tạo thành công. Email chào mừng đã được gửi.",
    });
  }
);
