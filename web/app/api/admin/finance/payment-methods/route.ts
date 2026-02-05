import { NextResponse } from "next/server";
import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { createPaymentMethodSchema } from "@/lib/schemas/finance";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("read", "Payment")) { // Assuming generic finance read implies methods
       return NextResponse.json(
        { success: false, error: "Bạn không có quyền xem phương thức thanh toán" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);
    const methods = await repository.getPaymentMethods();

    return apiSuccess(methods);
  }
);

export const POST = createApiHandler(
  {
      requireAuth: true,
      bodySchema: createPaymentMethodSchema
  },
  async ({ body, user }) => {
      // Not strictly implementing repo method yet as it's simple insert
      // But keeping Auth V2 pattern
      const ability = createAbility({ userId: user.id, role: user.role });
      if (ability.cannot("create", "Payment")) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const supabase = createServiceClient();
      const { data, error } = await supabase.from("payment_methods").insert({
          ...body,
          is_active: true
      }).select().single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return apiSuccess(data);
  }
)
