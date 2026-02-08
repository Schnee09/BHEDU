/**
 * Admin Fee Types API
 * GET/POST /api/admin/fee-types
 * Refactored to V5.0 Standard API Handler
 */

import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createFeeTypeSchema } from "@/lib/schemas";
import { FeeTypeRepository } from "@/lib/repositories/FeeTypeRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * GET /api/admin/fee-types
 * List all fee types
 */
export const GET = createGetHandler(
  { permission: "fee_types.view" },
  async ({ searchParams }) => {
    const supabase = createServiceClient();
    const repository = new FeeTypeRepository(supabase);

    const is_active = searchParams.get("is_active");
    const academic_year_id = searchParams.get("academic_year_id");

    const data = await repository.findAllFiltered({
      is_active: is_active !== null ? is_active === "true" : undefined,
      academic_year_id: academic_year_id || undefined,
    });

    return apiSuccess(data);
  },
);

/**
 * POST /api/admin/fee-types
 * Create a new fee type
 */
export const POST = createApiHandler(
  {
    permission: "fee_types.manage",
    bodySchema: createFeeTypeSchema,
  },
  async ({ body }) => {
    const supabase = createServiceClient();
    const repository = new FeeTypeRepository(supabase);

    const data = await repository.create(body);

    return apiSuccess(data, {
      message: "Loại phí đã được tạo thành công",
    });
  },
);
