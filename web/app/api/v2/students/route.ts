/**
 * Students API V2 (Phase 3 Migration)
 * GET/POST /api/v2/students
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
import { StudentRepository } from "@/lib/repositories/StudentRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { createAbility } from "@/lib/auth/permissions";

// Import consolidated schemas
import {
  type CreateStudentInput,
  createStudentSchema,
  type StudentQuery,
  studentQuerySchema,
} from "@/lib/schemas";

// TODO: Phase 3 - Use consolidated createStudentSchema after repository migration
// For now, use old schema for backward compatibility
// import { createStudentSchema } from "@/lib/schemas/students";
// import type { CreateStudentInput } from "@/lib/schemas/requests/student";

// GET /api/v2/students
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

    // 3. Clean and Validate Query
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (key === "search" && value.trim() === "") return; // Skip empty search
      params[key] = value;
    });

    const validatedQuery = studentQuerySchema.parse(params);

    // Map limit to pageSize for repository
    const queryOpts = {
      ...validatedQuery,
      pageSize: validatedQuery.limit,
    };

    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);

    // 3. Create ability instance for permission checks
    const ability = createAbility({
      userId: user.id,
      role: user.role,
      // TODO: Get classIds from user profile for teachers
      classIds: [],
    });

    // 4. Permission-based data access
    // Check if user can read students
    if (ability.can("read", "Student")) {
      // Admin/Staff can see all students
      if (
        user.role === "admin" || user.role === "staff" ||
        user.role === "super_admin" || user.role === "owner"
      ) {
        const { data, ...pagination } = await repository.findAll(
          queryOpts,
        );
        return apiPaginated(data, pagination);
      }

      // Teachers can see students in their classes
      if (user.role === "teacher" || user.role === "tutor") {
        const { data, ...pagination } = await repository.findByTeacher(
          user.id,
          queryOpts,
        );
        return apiPaginated(data, pagination);
      }

      // Students can only see themselves
      if (user.role === "student") {
        const student = await repository.findById(user.id);
        return apiPaginated(student ? [student] : [], {
          page: 1,
          pageSize: 1,
          total: student ? 1 : 0,
        });
      }

      // Parents can see their linked children
      if (user.role === "parent") {
        // TODO: Implement findByParent in StudentRepository
        return apiPaginated([], {
          page: 1,
          pageSize: 0,
          total: 0,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: ability.reasonFor("read", "Student") || "Forbidden",
      },
      { status: 403 },
    );
  },
);

// POST /api/v2/students
export const POST = createApiHandler(
  {
    allowedRoles: ["admin", "staff", "super_admin", "owner"],
    bodySchema: createStudentSchema,
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

    if (ability.cannot("create", "Student")) {
      return NextResponse.json(
        {
          success: false,
          error: ability.reasonFor("create", "Student") ||
            "You do not have permission to create students",
        },
        { status: 403 },
      );
    }

    // 3. Create student
    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);
    // TODO: Phase 3 - Update repository types to match consolidated schema
    const student = await repository.create(body as any);

    return apiSuccess(student, { _status: 201 });
  },
);
