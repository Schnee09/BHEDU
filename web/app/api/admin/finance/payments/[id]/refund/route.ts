import { apiSuccess, createApiHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { refundPaymentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  { permission: 'finance.refund', bodySchema: refundPaymentSchema },
  async ({ body, params, user }) => {
    const paymentId = params.id;
    if (!paymentId) throw new ValidationError('payment id is required');

    const { data, error } = await createServiceClient().rpc('refund_payment_atomic', {
      p_payment_id: paymentId,
      p_amount: body.amount,
      p_reason: body.reason,
      p_refunded_by: user.id,
    });

    if (error) throw new ValidationError(error.message);
    const refund = Array.isArray(data) ? data[0] : data;
    return apiSuccess(refund, { _status: 201 });
  }
);
