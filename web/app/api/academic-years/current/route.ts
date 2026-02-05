import { apiSuccess, createGetHandler } from "@/lib/api/apiHandler";
import { settingsService } from "@/lib/services/settingsService";

/**
 * GET /api/academic-years/current - Get current academic year (Public)
 */
export const GET = createGetHandler({ requireAuth: false }, async () => {
  const academicYear = await settingsService.getCurrentAcademicYear();
  return apiSuccess({ academicYear });
});
