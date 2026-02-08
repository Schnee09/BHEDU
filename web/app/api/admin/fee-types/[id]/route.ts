/**
 * Admin Fee Type ID API
 * GET/PATCH/DELETE /api/admin/fee-types/[id]
 * Standardized to V5.0 Architecture
 */

import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createFeeTypeSchema } from "@/lib/schemas";
import { FeeTypeRepository } from "@/lib/repositories/FeeTypeRepository";
import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/api/errors";

/**
 * GET /api/admin/fee-types/[id]
 */
export const GET = createGetHandler(
  { permission: "fee_types.view" },
  async ({ params }) => {
    const supabase = createServiceClient();
    const repository = new FeeTypeRepository(supabase);

    const data = await repository.findById(params.id);

    if (!data) {
      throw new NotFoundError("Fee type not found");
    }

    return apiSuccess(data);
  },
);

/**
 * PATCH /api/admin/fee-types/[id]
 */
export const PATCH = createApiHandler(
  {
    permission: "fee_types.manage",
    bodySchema: createFeeTypeSchema.partial(),
  },
  async ({ params, body }) => {
    const supabase = createServiceClient();
    const repository = new FeeTypeRepository(supabase);

    // Verify existence
    const existing = await repository.findById(params.id);
    if (!existing) {
      throw new NotFoundError("Fee type not found");
    }

    const data = await repository.update(params.id, body);

    return apiSuccess(data, {
      message: "Loại phí đã được cập nhật thành công",
    });
  },
);

/**
 * DELETE /api/admin/fee-types/[id]
 */
export const DELETE = createApiHandler(
  { permission: "fee_types.manage" },
  async ({ params }) => {
    const supabase = createServiceClient();
    const repository = new FeeTypeRepository(supabase);

    // Verify existence
    const existing = await repository.findById(params.id);
    if (!existing) {
      throw new NotFoundError("Fee type not found");
    }

    // Check if being used (Optional: Add check for active invoices later)

    await repository.delete(params.id);

    return apiSuccess(null, {
      message: "Loại phí đã được xóa thành công",
    });
  },
);
