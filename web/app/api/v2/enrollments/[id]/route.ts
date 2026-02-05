/**
 * Enrollments API V2 - Resource Detail
 * GET/PATCH/DELETE /api/v2/enrollments/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import {
    checkRateLimit,
    getRateLimitIdentifier,
    rateLimitConfigs,
} from "@/lib/auth/rateLimit";
import { staffAuth, teacherAuth } from "@/lib/auth/adminAuth";
import { EnrollmentRepository } from "@/lib/repositories/EnrollmentRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validation Schemas
const updateSchema = z.object({
    status: z.enum(["enrolled", "withdrawn", "completed", "dropped"])
        .optional(),
    notes: z.string().optional().nullable(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, {
                status: 429,
            });
        }

        // Auth
        const auth = await teacherAuth(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.reason || "Unauthorized" }, {
                status: 401,
            });
        }

        const supabase = createServiceClient();
        const repository = new EnrollmentRepository(supabase);

        const enrollment = await repository.findByIdWithDetails(id);
        if (!enrollment) {
            return NextResponse.json({ error: "Enrollment not found" }, {
                status: 404,
            });
        }

        // Role-based access logic
        if (
            auth.userRole === "student" && auth.userId !== enrollment.student_id
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ success: true, enrollment });
    } catch (error) {
        console.error("[API] GET /api/v2/enrollments/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, {
            status: 500,
        });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, {
                status: 429,
            });
        }

        // Auth - staff/admin only
        const auth = await staffAuth(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.reason || "Forbidden" }, {
                status: 403,
            });
        }

        // Parse body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, {
                status: 400,
            });
        }

        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({
                error: "Validation Error",
                details: parsed.error.issues,
            }, { status: 400 });
        }

        const supabase = createServiceClient();
        const repository = new EnrollmentRepository(supabase);

        const updated = await repository.update(id, parsed.data);
        return NextResponse.json({ success: true, enrollment: updated });
    } catch (error) {
        console.error("[API] PATCH /api/v2/enrollments/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, {
            status: 500,
        });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, {
                status: 429,
            });
        }

        // Auth - staff/admin only
        const auth = await staffAuth(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.reason || "Forbidden" }, {
                status: 403,
            });
        }

        const supabase = createServiceClient();
        const repository = new EnrollmentRepository(supabase);

        await repository.delete(id);
        return NextResponse.json({
            success: true,
            message: "Enrollment deleted",
        });
    } catch (error) {
        console.error("[API] DELETE /api/v2/enrollments/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, {
            status: 500,
        });
    }
}
