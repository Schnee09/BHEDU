import { NextResponse } from "next/server";
import {
  apiSuccess,
  createGetHandler,
} from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { UserRepository } from "@/lib/repositories/UserRepository";

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("read", "User")) {
       return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();
    const repository = new UserRepository(supabase);
    const stats = await repository.getStatistics();

    return apiSuccess(stats);
  }
);
