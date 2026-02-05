/**
 * Individual course API endpoint (v1) - REFACTORED
 */

import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateCourseSchema, uuidSchema } from "@/lib/schemas";
import { CourseService } from "@/lib/services/courseService";

/**
 * GET /api/v1/courses/[id]
 * Get a single course by ID
 */
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ params }) => {
    const course = await CourseService.getCourseById(params.id);
    return apiSuccess(course);
  },
);

/**
 * PATCH /api/v1/courses/[id]
 * Update a course (admin only)
 */
export const PATCH = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: updateCourseSchema,
  },
  async ({ params, body }) => {
    const course = await CourseService.updateCourse(params.id, body);
    return apiSuccess(course, { message: "Course updated successfully" });
  },
);

/**
 * DELETE /api/v1/courses/[id]
 * Delete a course (admin only)
 */
export const DELETE = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ params }) => {
    await CourseService.deleteCourse(params.id);
    return apiSuccess(null, { message: "Course deleted successfully" });
  },
);
