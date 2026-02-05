import { NextResponse } from "next/server";
import { createGetHandler } from "@/lib/api";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";
import { createServiceClient } from "@/lib/supabase/server";

export const GET = createGetHandler(
    { requireAuth: true },
    async ({ request, user, searchParams }) => {
        // Permission check handled by ability/repository logic or role checks here if simpler
        // Ideally we use Ability:
        // const ability = createAbility({ userId: user.id, role: user.role });
        // if (ability.cannot('read', 'FinancialReport')) ...

        // For now, let's assume 'staff' and up can view reports, consistent with previous adminAuth
        const allowedRoles = [
            "admin",
            "super_admin",
            "staff",
            "owner",
            "accountant",
        ];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 403,
            });
        }

        const type = searchParams.get("type");
        const startDate = searchParams.get("start_date") || undefined;
        const endDate = searchParams.get("end_date") || undefined;

        const supabase = createServiceClient();
        const repository = new FinanceRepository(supabase);

        let data;

        switch (type) {
            case "dashboard":
                data = await repository.getDashboardStats();
                break;
            case "revenue":
                data = await repository.getRevenueReport(startDate, endDate);
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid report type" },
                    { status: 400 },
                );
        }

        return NextResponse.json({ data });
    },
);
