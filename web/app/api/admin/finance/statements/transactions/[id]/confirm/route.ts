import { apiSuccess, createApiHandler } from '@/lib/api';
import { confirmBankTransactionSchema } from '@/lib/schemas/requests/finance';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: confirmBankTransactionSchema },
  async ({ params, body, user }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('confirm_bank_transaction_payment', {
      p_transaction_id: params.id,
      p_student_id: body.student_id,
      p_payment_method_id: body.payment_method_id,
      p_allocations: body.allocations,
      p_reviewed_by: user.id,
      p_notes: body.notes || null,
    });
    if (error) throw error;
    return apiSuccess(data);
  }
);
