/**
 * Classes API V2 (Phase 3 Migration)
 * GET/POST /api/v2/classes
 *
 * ✅ Uses consolidated schemas from lib/schemas
 * ✅ Uses AbilityService for contextual permissions
 * ✅ Type-safe responses with ApiResponse<T>
 */

import { NextRequest, NextResponse } from "next/server";
import {
    apiPaginated,
    apiSuccess,
    createApiHandler,
    createGetHandler,
} from "@/lib/api";
import {
    checkRateLimit,
    getRateLimitIdentifier,
    rateLimitConfigs,
} from "@/lib/auth/rateLimit";
import { ClassRepository } from "@/lib/repositories/ClassRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";

// Import consolidated schemas
import { classQuerySchema, createClassSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// GET /api/v2/classes
export const GET = createGetHandler(
    { requireAuth: true },
    async ({ request, user, searchParams }) => {
        // 1. Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: "Rate limit exceeded" },
                { status: 429 },
            );
        }

        // 2. Validate query using consolidated schema
        const params: Record<string, any> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        const validatedQuery = classQuerySchema.parse(params);

        const supabase = createServiceClient();
        const repository = new ClassRepository(supabase);

        // 3. Create ability instance
        const ability = createAbility({
            userId: user.id,
            role: user.role,
            classIds: [], // TODO: Get from user profile
        });

        // 4. Permission-based data access
        if (ability.can("read", "Class")) {
            // Admin/Staff can see all classes
            if (
                user.role === "admin" || user.role === "staff" ||
                user.role === "super_admin" || user.role === "owner"
            ) {
                const { data, ...pagination } = await repository.findAll(
                    validatedQuery,
                );
                return apiPaginated(data, pagination);
            }

            // Teachers can see their classes
            if (user.role === "teacher" || user.role === "tutor") {
                const { data, ...pagination } = await repository.findAll({
                    ...validatedQuery,
                    teacher_id: user.id,
                });
                return apiPaginated(data, pagination);
            }

            // Students can see classes they're enrolled in
            if (user.role === "student") {
                // TODO: Implement findByStudent in ClassRepository
                const { data, ...pagination } = await repository.findAll(
                    validatedQuery,
                );
                return apiPaginated(data, pagination);
            }

            // Parents can see their children's classes
            if (user.role === "parent") {
                // TODO: Implement findByParent in ClassRepository
                return apiSuccess({
                    data: [],
                    pagination: { page: 1, pageSize: 0, total: 0 },
                });
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: ability.reasonFor("read", "Class") || "Forbidden",
            },
            { status: 403 },
        );
    },
);

// POST /api/v2/classes
export const POST = createApiHandler(
    {
        allowedRoles: ["admin", "staff", "super_admin", "owner"],
        bodySchema: createClassSchema,
    },
    async ({ request, body, user }) => {
        // 1. Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: "Rate limit exceeded" },
                { status: 429 },
            );
        }

        // 2. Permission check using AbilityService
        const ability = createAbility({
            userId: user.id,
            role: user.role,
        });

        if (ability.cannot("create", "Class")) {
            return NextResponse.json(
                {
                    success: false,
                    error: ability.reasonFor("create", "Class") ||
                        "You do not have permission to create classes",
                },
                { status: 403 },
            );
        }

        // 3. Create class
        const supabase = createServiceClient();
        const repository = new ClassRepository(supabase);

        // TODO: Phase 3 - Update repository types to match consolidated schema
        const cls = await repository.create(body as any);

        return apiSuccess({ class: cls }, { _status: 201 });
    },
);
