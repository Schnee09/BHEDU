/**
 * Tuition Payment Matrix API
 * GET /api/admin/finance/tuition-matrix
 * POST /api/admin/finance/tuition-matrix
 */

import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { financeService } from "@/lib/services";
import { tuitionMatrixUpdateSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/api/errors";

export const GET = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ searchParams }) => {
    const classId = searchParams.get("class_id");
    const academicYearId = searchParams.get("academic_year_id");
    const monthsStr = searchParams.get("months"); // Comma-separated list of dates, e.g. "2026-06-01,2026-07-01,2026-08-01"

    if (!classId || !academicYearId || !monthsStr) {
      throw new ValidationError("class_id, academic_year_id, and months are required");
    }

    const months = monthsStr.split(",");
    const data = await financeService.getTuitionMatrix(classId, academicYearId, months);
    
    return apiSuccess(data);
  }
);

export const POST = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: tuitionMatrixUpdateSchema,
  },
  async ({ body }) => {
    const result = await financeService.updateTuitionMatrix(
      body.classId,
      body.academicYearId,
      body.updates
    );

    return apiSuccess(result);
  }
);
