import { NextResponse } from "next/server";
import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { studentAccountQuerySchema } from "@/lib/schemas/finance";
import { z } from "zod";

export const GET = createGetHandler(
  { requireAuth: true, querySchema: studentAccountQuerySchema },
  async ({ query, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("read", "Finance")) { // Using general finance permission
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền xem tài khoản học phí" },
        { status: 403 },
      );
    }

    const { student_id, academic_year_id, status, page, limit } = query;
    // status can be "all" or specific enum
    // querySchema handles transforms

    // Additional hack for 'has_balance' param not in main schema but used in legacy
    // We can just rely on status or add it to schema later if critical.
    // For now, let's stick to what's defined in repository support.

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    const result = await repository.getStudentAccounts({
      student_id,
      academic_year_id,
      status: status === "all" ? undefined : status,
      page,
      limit,
    });

    if (result.note) {
      return apiPaginated([], { page: 1, pageSize: limit, total: 0 }, {
        note: result.note,
      });
    }

    return apiPaginated(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  },
);

const createAccountSchema = z.object({
  student_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
});

export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: createAccountSchema,
  },
  async ({ body, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("create", "Finance")) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền tạo tài khoản học phí" },
        { status: 403 },
      );
    }

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    try {
      const account = await repository.createStudentAccount(
        body.student_id,
        body.academic_year_id,
      );
      return apiSuccess(account, { status: 201 });
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ success: false, error: error.message }, {
          status: 409,
        });
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to create student account",
        },
        { status: 500 },
      );
    }
  },
);
