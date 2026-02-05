/**
 * Role-aware Students API
 * GET/POST /api/students
 *
 * Access rules:
 * - admin: can list all students; can create/edit/delete
 * - staff: can list all students; can create/edit/delete
 * - teacher: can list students in their assigned classes only
 *
 * Refactored to use StudentService for data access
 */

import { NextRequest, NextResponse } from "next/server";
import { apiPaginated } from "@/lib/api";
import { validateQuery } from "@/lib/api/validation";
import {
  studentQuerySchema,
} from "@/lib/schemas";
import { handleApiError } from "@/lib/api/errors";
import { adminAuth, staffAuth, teacherAuth } from "@/lib/auth/adminAuth";
import {
  GET as adminGET,
  POST as adminPOST,
} from "@/app/api/admin/students/route";
import { studentService } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await teacherAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || "Unauthorized" }, {
        status: 401,
      });
    }

    // Admin and staff use the existing admin endpoint
    if (
      auth.userRole === "admin" || auth.userRole === "staff" ||
      auth.userRole === "super_admin" || auth.userRole === "owner"
    ) {
      return adminGET(request);
    }

    // Teachers only
    if (auth.userRole !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use centralized studentService singleton
    const queryParams = validateQuery(request, studentQuerySchema);

    // teacherAuth ensures userId is set if authorized
    const result = await studentService.getStudentsForTeacher(
      auth.userId || "",
      {
        search: queryParams.search,
        page: queryParams.page,
        limit: queryParams.limit,
        status: queryParams.status,
        grade_level: queryParams.grade_level,
        gender: queryParams.gender,
      },
    );

    return apiPaginated(
      result.students || [],
      {
        page: queryParams.page || 1,
        pageSize: queryParams.limit || 20,
        total: result.total || 0,
      },
      // Statistics not returned anymore in simplified service
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  // Create is staff/admin only
  const isStaff = await staffAuth(request);
  const isAdmin = await adminAuth(request);
  if (!isStaff.authorized && !isAdmin.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return adminPOST(request);
}
