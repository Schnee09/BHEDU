/**
 * Bulk Invoice Generation API
 * POST /api/admin/finance/invoices/bulk
 */

import { apiSuccess, createApiHandler } from "@/lib/api";
import { financeService } from "@/lib/services";
import { bulkGenerateInvoicesSchema } from "@/lib/schemas";

export const POST = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: bulkGenerateInvoicesSchema,
  },
  async ({ body }) => {
    const result = await financeService.bulkGenerateClassInvoices(
      body.class_id,
      body.academic_year_id,
      body.month,
      body.due_date,
      body.amount,
      body.description
    );

    return apiSuccess(result, { _status: 201 });
  }
);
