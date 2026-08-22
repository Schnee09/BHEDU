/**
 * Admin Finance Overview API
 * GET /api/admin/finance/overview
 */

import { apiSuccess, createGetHandler } from "@/lib/api";
import { financeService } from "@/lib/services";
import { ValidationError } from "@/lib/api/errors";

export const GET = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ searchParams }) => {
    const academicYearId = searchParams.get("academic_year_id");

    if (!academicYearId) {
      throw new ValidationError("academic_year_id is required");
    }

    const stats = await financeService.getOverview(academicYearId);
    return apiSuccess(stats);
  }
);
