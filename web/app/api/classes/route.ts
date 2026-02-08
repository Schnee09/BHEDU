import { NextRequest } from "next/server";
import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
} from "@/lib/api/apiHandler";
import { ClassService } from "@/lib/services/classService";
import { createClassSchema } from "@/lib/schemas";

/**
 * GET /api/classes - Fetch classes with role-based visibility
 */
export const GET = createApiHandler({
  permission: "classes.view",
}, async ({ user, searchParams }) => {
  const filters = {
    search: searchParams.get("search") || undefined,
    courseId: searchParams.get("courseId") || undefined,
    teacherId: searchParams.get("teacherId") || undefined,
    academicYearId: searchParams.get("academicYearId") || undefined,
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
    context: {
      role: user.role,
      profileId: user.id,
    },
  };

  const { classes, total, page, pageSize } = await ClassService.getClasses(
    filters,
  );

  return apiPaginated(classes, {
    page,
    pageSize,
    total,
  });
});

/**
 * POST /api/classes - Create a new class
 */
export const POST = createApiHandler({
  permission: "classes.manage",
  bodySchema: createClassSchema,
}, async ({ body }) => {
  // Normalize body for the service if needed (though bodySchema should handle it)
  // The service expects snake_case, but the schema might allow camelCase
  // createClassSchema typically uses snake_case as per BH-EDU conventions

  const newClass = await ClassService.createClass(body as any);

  return apiSuccess(newClass);
});
