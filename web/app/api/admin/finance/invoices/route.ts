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
import { createInvoiceSchema } from "@/lib/schemas/finance";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("read", "Invoice")) {
       return NextResponse.json(
        { success: false, error: "Bạn không có quyền xem hóa đơn" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("student_id") || undefined;
    const status = searchParams.get("status") || undefined;
    const academic_year_id = searchParams.get("academic_year_id") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 25;

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    const result = await repository.getInvoices({
        student_id,
        status,
        academic_year_id,
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
    bodySchema: createInvoiceSchema,
  },
  async ({ body, user }) => {
    const ability = createAbility({
      userId: user.id,
      role: user.role,
    });

    if (ability.cannot("create", "Invoice")) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền tạo hóa đơn" },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);
    
    try {
        const invoice = await repository.createInvoice(body);
        return apiSuccess(invoice, { message: "Hóa đơn đã được tạo thành công" });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create invoice" },
            { status: 500 }
        );
    }
  }
);
