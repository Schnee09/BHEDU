/**
 * Class Students API V2
 * GET /api/v2/classes/[id]/students
 *
 * ✅ Uses ClassRepository and standardized pattern
 * ✅ Fully type-safe and permission-aware
 */

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { ClassRepository } from "@/lib/repositories/ClassRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const GET = createGetHandler(
    { requireAuth: true },
    async ({ params, user }) => {
        try {
            const { id } = await params;
            const supabase = createServiceClient();
            const repository = new ClassRepository(supabase);

            // 1. Permission Check
            const ability = createAbility({
                userId: user.id,
                role: user.role,
            });

            if (ability.cannot("read", "Class")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: ability.reasonFor("read", "Class") ||
                            "Forbidden",
                    },
                    { status: 403 },
                );
            }

            // 2. Fetch Data
            const students = await repository.getClassStudents(id);

            // 3. Optional: Filter by student if they are reading their own class
            // (Though usually handled by ability for specific class access)

            return apiSuccess(students);
        } catch (error) {
            logger.error("V2 Get class students error", error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Internal server error",
                },
                { status: 500 },
            );
        }
    },
);
