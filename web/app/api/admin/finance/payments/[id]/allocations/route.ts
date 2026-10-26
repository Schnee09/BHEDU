import { apiSuccess, createApiHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { FinanceRepository } from '@/lib/repositories/FinanceRepository';
import { allocatePaymentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: allocatePaymentSchema },
  async ({ body, params }) => {
    const paymentId = params.id;
    if (!paymentId) throw new ValidationError('payment id is required');
    const repository = new FinanceRepository(createServiceClient());
    return apiSuccess(await repository.allocateStudentPayment(paymentId, body.allocations));
  }
);
