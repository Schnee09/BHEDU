import {
    apiPaginated,
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createInvoiceSchema } from "@/lib/schemas";
import { createAbility } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

export const GET = createGetHandler(
    { requireAuth: true },
    async ({ request, user, searchParams }) => {
        const ability = createAbility({ userId: user.id, role: user.role });
        if (ability.cannot("read", "Invoice")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 },
            );
        }

        const student_id = searchParams.get("student_id") || undefined;
        const status = searchParams.get("status") || undefined;
        const academic_year_id = searchParams.get("academic_year_id") ||
            undefined;
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("pageSize")) ||
            Number(searchParams.get("limit")) || 20;

        const supabase = createServiceClient();
        const repository = new FinanceRepository(supabase);

        const result = await repository.getInvoices({
            student_id,
            status,
            academic_year_id,
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
        bodySchema: createInvoiceSchema,
    },
    async ({ body, user }) => {
        // Double check ability if complex rules exist
        const ability = createAbility({ userId: user.id, role: user.role });
        if (ability.cannot("create", "Invoice")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 },
            );
        }

        const supabase = createServiceClient();
        const repository = new FinanceRepository(supabase);

        const invoice = await repository.createInvoice(body);
        return apiSuccess(invoice, { message: "Invoice created successfully" });
    },
);
