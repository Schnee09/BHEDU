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
import { createPaymentSchema } from "@/lib/schemas/finance";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("read", "Payment")) {
       return NextResponse.json(
        { success: false, error: "Bạn không có quyền xem thanh toán" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("student_id") || undefined;
    const start_date = searchParams.get("start_date") || undefined;
    const end_date = searchParams.get("end_date") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 25;

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    const result = await repository.getPayments({
        student_id,
        start_date,
        end_date,
        page,
        limit
    });

    return apiPaginated(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  }
);

export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: createPaymentSchema,
  },
  async ({ body, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("create", "Payment")) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền tạo thanh toán" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);
    
    try {
        const payment = await repository.createPayment(body, user.id);
        return apiSuccess(payment, { message: "Thanh toán đã được tạo thành công" });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create payment" },
            { status: 500 }
        );
    }
  }
);
