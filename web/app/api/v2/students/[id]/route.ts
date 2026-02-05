/**
 * Students API V2 - Resource Detail (REFACTORED)
 * GET/PATCH/DELETE /api/v2/students/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import {
    checkRateLimit,
    getRateLimitIdentifier,
    rateLimitConfigs,
} from "@/lib/auth/rateLimit";
import { StudentRepository } from "@/lib/repositories/StudentRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";

// Validation Schemas
const updateSchema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional().nullable(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
        .nullable(),
    gender: z.enum(["male", "female", "other"]).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    emergency_contact: z.string().max(100).optional().nullable(),
    grade_level: z.string().max(20).optional().nullable(),
    status: z.enum(["active", "inactive", "graduated", "transferred"])
        .optional(),
});

// GET /api/v2/students/[id]
export const GET = createGetHandler(
    { requireAuth: true },
    async ({ params, request, user }) => {
        // 1. Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: "Rate limit exceeded",
            }, { status: 429 });
        }

        const id = params.id;
        const supabase = createServiceClient();
        const repository = new StudentRepository(supabase);

        // 2. Role-based access logic
        if (user.role === "student" && user.id !== id) {
            throw new AuthorizationError("Forbidden");
        }

        const student = await repository.findByIdWithEnrollments(id);
        if (!student) {
            throw new NotFoundError("Student not found");
        }

        return apiSuccess(student);
    },
);

// PATCH /api/v2/students/[id]
export const PATCH = createApiHandler(
    {
        allowedRoles: ["admin", "staff"],
        bodySchema: updateSchema,
    },
    async ({ params, request, body }) => {
        // 1. Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: "Rate limit exceeded",
            }, { status: 429 });
        }

        const id = params.id;
        const supabase = createServiceClient();
        const repository = new StudentRepository(supabase);

        const updated = await repository.update(id, body);
        return apiSuccess(updated);
    },
);

// DELETE /api/v2/students/[id]
export const DELETE = createGetHandler(
    { allowedRoles: ["admin", "staff"] },
    async ({ params, request }) => {
        // 1. Rate limit
        const identifier = getRateLimitIdentifier(request);
        const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
        if (!rateCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: "Rate limit exceeded",
            }, { status: 429 });
        }

        const id = params.id;
        const supabase = createServiceClient();
        const repository = new StudentRepository(supabase);

        await repository.softDelete(id);
        return apiSuccess(null, { message: "Student archived successfully" });
    },
);
