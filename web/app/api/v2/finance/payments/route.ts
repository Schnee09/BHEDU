import {
    apiPaginated,
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createPaymentSchema } from "@/lib/schemas";
import { createAbility } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

export const GET = createGetHandler(
    { requireAuth: true },
    async ({ request, user, searchParams }) => {
        const ability = createAbility({ userId: user.id, role: user.role });
        if (ability.cannot("read", "Payment")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 },
            );
        }

        const student_id = searchParams.get("student_id") || undefined;
        const start_date = searchParams.get("start_date") || undefined;
        const end_date = searchParams.get("end_date") || undefined;
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("pageSize")) ||
            Number(searchParams.get("limit")) || 20;

        const supabase = createServiceClient();
        const repository = new FinanceRepository(supabase);

        const result = await repository.getPayments({
            student_id,
            start_date,
            end_date,
            page,
            limit,
        });

        return apiPaginated(result.data, {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
        });
    },
);

export const POST = createApiHandler(
    {
        allowedRoles: ["admin", "staff", "super_admin", "owner"],
        bodySchema: createPaymentSchema,
    },
    async ({ body, user }) => {
        const ability = createAbility({ userId: user.id, role: user.role });
        if (ability.cannot("create", "Payment")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 },
            );
        }

        const supabase = createServiceClient();
        const repository = new FinanceRepository(supabase);

        const payment = await repository.createPayment(body, user.id);
        return apiSuccess(payment, {
            message: "Payment recorded successfully",
        });
    },
);
