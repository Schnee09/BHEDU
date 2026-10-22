import { apiSuccess, createApiHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { cancelInvoiceSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: cancelInvoiceSchema },
  async ({ body, params, user }) => {
    const invoiceId = params.id;
    if (!invoiceId) throw new ValidationError('invoice id is required');

    const { data, error } = await createServiceClient().rpc('cancel_unpaid_invoice_atomic', {
      p_invoice_id: invoiceId,
      p_reason: body.reason,
      p_cancelled_by: user.id,
    });

    if (error) throw new ValidationError(error.message);
    const invoice = Array.isArray(data) ? data[0] : data;
    return apiSuccess(invoice);
  }
);
