import { NextRequest } from "next/server";
import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
} from "@/lib/api/apiHandler";
import { studentService } from "@/lib/services";
import { hasPermission } from "@/lib/auth/core";
import { createStudentSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/students - List students with role-aware filtering
 */
export const GET = createApiHandler({
  permission: "students.view",
}, async ({ user, searchParams }) => {
  const role = user.role;
  const profileId = user.id;

  const commonFilters = {
    search: searchParams.get("search") || undefined,
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) ||
      Number(searchParams.get("limit")) || 20,
    status: searchParams.get("status") || undefined,
    grade_level: searchParams.get("grade_level") || undefined,
    gender: searchParams.get("gender") || undefined,
  };

  // 1. Staff/Admin: See all students
  if (hasPermission(role, "students.create")) {
    const result = await studentService.getStudents(commonFilters);
    return apiPaginated(result.students, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  }

  // 2. Teachers: See students in their assigned classes
  if (role === "teacher") {
    // Map pageSize to limit for this specific service method (standardizing soon)
    const teacherFilters = {
      ...commonFilters,
      limit: commonFilters.pageSize,
    };

    const result = await studentService.getStudentsForTeacher(
      profileId,
      teacherFilters,
    );

    return apiPaginated(result.students, {
      page: commonFilters.page,
      pageSize: commonFilters.pageSize,
      total: result.total,
    });
  }

  // 3. Others: No access or empty
  return apiSuccess([]);
});

/**
 * POST /api/students - Create a new student (Staff/Admin only)
 */
export const POST = createApiHandler({
  permission: "students.create",
  bodySchema: createStudentSchema,
}, async ({ body }) => {
  const newStudent = await studentService.createStudent(body);
  return apiSuccess(newStudent);
});
