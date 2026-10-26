import { apiSuccess, createApiHandler } from '@/lib/api';
import { ConflictError, ValidationError } from '@/lib/api/errors';
import { ignoreBankTransactionSchema } from '@/lib/schemas/requests/finance';
import { createServiceClient } from '@/lib/supabase/server';

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: ignoreBankTransactionSchema },
  async ({ params, body, user }) => {
    if (!params.id) throw new ValidationError('Thiếu mã giao dịch ngân hàng');

    const { data, error } = await createServiceClient()
      .from('bank_statement_transactions')
      .update({
        match_status: 'ignored',
        match_reason: { type: 'manual_ignore', reason: body.reason },
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .in('match_status', ['unmatched', 'suggested', 'needs_review'])
      .is('matched_payment_id', null)
      .select('id, match_status, match_reason, reviewed_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ConflictError('Giao dịch đã được xử lý hoặc không còn có thể bỏ qua');
    }

    return apiSuccess(data);
  }
);
