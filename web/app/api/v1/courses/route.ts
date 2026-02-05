/**
 * Courses API endpoint (v1) - REFACTORED
 */

import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { createCourseSchema } from "@/lib/schemas";
import { CourseService } from "@/lib/services/courseService";

/**
 * GET /api/v1/courses
 * List all courses with optional filtering and pagination
 */
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ searchParams }) => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;

    const result = await CourseService.getCourses({
      page,
      pageSize,
      search,
      subjectId,
    });

    return apiPaginated(result.courses, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  },
);

/**
 * POST /api/v1/courses
 * Create a new course (admin only)
 */
export const POST = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: createCourseSchema,
  },
  async ({ body }) => {
    const course = await CourseService.createCourse(body);
    return apiSuccess(course, { _status: 201 });
  },
);
