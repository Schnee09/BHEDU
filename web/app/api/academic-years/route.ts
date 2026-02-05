import { apiSuccess, createGetHandler } from "@/lib/api/apiHandler";
import { settingsService } from "@/lib/services/settingsService";

/**
 * GET /api/academic-years - Get all academic years (Public)
 */
export const GET = createGetHandler({ requireAuth: false }, async () => {
  const academicYears = await settingsService.getAcademicYears();
  return apiSuccess(academicYears);
});
