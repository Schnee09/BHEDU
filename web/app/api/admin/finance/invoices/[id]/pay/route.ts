/**
 * Record Payment for Invoice API
 * POST /api/admin/finance/invoices/[id]/pay
 */

import { apiSuccess, createApiHandler } from "@/lib/api";
import { financeService } from "@/lib/services";
import { recordPaymentSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/api/errors";

export const POST = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: recordPaymentSchema.omit({ student_id: true }), // student_id is fetched from invoice
  },
  async ({ body, params }) => {
    const { id: invoiceId } = params;

    if (!invoiceId) {
      throw new ValidationError("invoice id is required");
    }

    const payment = await financeService.payInvoice(invoiceId, {
      payment_method_id: body.payment_method_id,
      amount: body.amount,
      reference_number: body.reference_number,
      payment_date: body.payment_date,
      notes: body.notes,
    });

    return apiSuccess(payment, { _status: 201 });
  }
);
