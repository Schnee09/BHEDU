/**
 * Admin Enrollments API
 * GET/POST /api/admin/enrollments
 * Refactored to V5.0 Standard API Handler
 */

import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { createEnrollmentSchema, enrollmentQuerySchema } from "@/lib/schemas";
import { enrollmentService } from "@/lib/services/enrollmentService";

/**
 * GET /api/admin/enrollments
 * List all enrollments with filtering
 */
export const GET = createGetHandler(
  { permission: "enrollments.view" },
  async ({ searchParams }) => {
    // Convert URLSearchParams to object for Zod validation
    const params: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    const validated = enrollmentQuerySchema.parse(params);
    const result = await enrollmentService.getEnrollments(validated);

    return apiPaginated(
      result.enrollments,
      {
        page: result.page,
        pageSize: result.limit,
        total: result.total,
      },
    );
  },
);

/**
 * POST /api/admin/enrollments
 * Create a new enrollment
 */
export const POST = createApiHandler(
  {
    permission: "enrollments.manage",
    bodySchema: createEnrollmentSchema,
  },
  async ({ body }) => {
    const enrollment = await enrollmentService.createEnrollment(body);

    return apiSuccess(enrollment, {
      message: "Ghi danh học sinh thành công",
    });
  },
);
