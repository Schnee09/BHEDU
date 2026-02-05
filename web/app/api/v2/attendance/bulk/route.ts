import { NextResponse } from "next/server";
import { apiSuccess, createApiHandler } from "@/lib/api";
import {
    checkRateLimit,
    getRateLimitIdentifier,
    rateLimitConfigs,
} from "@/lib/auth/rateLimit";
import { AttendanceRepository } from "@/lib/repositories/AttendanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { type BulkAttendanceInput, bulkAttendanceSchema } from "@/lib/schemas";

// POST /api/v2/attendance/bulk
export const POST = createApiHandler(
    {
        allowedRoles: [
            "admin",
            "staff",
            "super_admin",
            "owner",
            "teacher",
            "tutor",
        ],
        bodySchema: bulkAttendanceSchema,
    },
    async ({ request, body, user }) => {
        // 1. Rate Check
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: "Rate limit exceeded" },
                { status: 429 },
            );
        }

        // 2. Permission Check
        const ability = createAbility({ userId: user.id, role: user.role });
        if (ability.cannot("create", "Attendance")) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 },
            );
        }

        // TODO: Extra verification if teacher teaches the class?
        // For V2 Proof of Concept, we rely on role + repository.

        // 3. Execution
        const supabase = createServiceClient();
        const repository = new AttendanceRepository(supabase);

        const result = await repository.createBulk(body as BulkAttendanceInput);

        return apiSuccess(result, { _status: 201 });
    },
);
