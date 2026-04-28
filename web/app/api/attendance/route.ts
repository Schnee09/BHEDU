/**
 * Attendance API (Unified)
 * GET/POST /api/attendance
 *
 * Uses Repository pattern, Zod validation, CASL permissions
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
import { AttendanceRepository } from "@/lib/repositories/AttendanceRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";
import {
  type AttendanceQueryInput,
  attendanceQuerySchema,
  type CreateAttendanceInput,
  createAttendanceSchema,
} from "@/lib/schemas";

// GET /api/attendance
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user, searchParams }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validatedQuery = attendanceQuerySchema.parse(params);

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const ability = createAbility({
      userId: user.id,
      role: user.role,
      classIds: [],
    });

    if (ability.can("read", "Attendance")) {
      if (
        ["admin", "staff", "super_admin", "owner"].includes(user.role)
      ) {
        const { data, ...pagination } = await repository.findAll(validatedQuery);
        return apiPaginated(data, pagination);
      }

      if (["teacher", "tutor"].includes(user.role)) {
        const { data, ...pagination } = await repository.findAll(validatedQuery);
        return apiPaginated(data, pagination);
      }

      if (user.role === "student") {
        const studentConfig = {
          ...validatedQuery,
          student_id: user.id,
        };
        const { data, ...pagination } = await repository.findAll(studentConfig);
        return apiPaginated(data, pagination);
      }

      return apiPaginated([], { page: 1, pageSize: 50, total: 0 });
    }

    return NextResponse.json(
      {
        success: false,
        error: ability.reasonFor("read", "Attendance") || "Forbidden",
      },
      { status: 403 },
    );
  },
);

// POST /api/attendance
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
    bodySchema: createAttendanceSchema,
  },
  async ({ request, body, user }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const ability = createAbility({ userId: user.id, role: user.role });
    if (ability.cannot("create", "Attendance")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);
    const record = await repository.create(body as CreateAttendanceInput);

    return apiSuccess(record, { _status: 201 });
  },
);
