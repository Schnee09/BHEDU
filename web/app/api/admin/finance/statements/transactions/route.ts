import { apiPaginated, createGetHandler } from '@/lib/api';
import {
  suggestStudentMatch,
  type StudentMatchCandidate,
} from '@/lib/finance/bankStatementMatching';
import { createServiceClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/api/errors';

const allowedStatuses = new Set(['unmatched', 'suggested', 'confirmed', 'ignored', 'needs_review']);

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Number(searchParams.get('limit') || '25');
  const status = searchParams.get('status') || 'unmatched';
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('page must be a positive integer');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ValidationError('limit must be an integer between 1 and 100');
  }
  if (status !== 'all' && !allowedStatuses.has(status)) {
    throw new ValidationError('status is invalid');
  }
  const start = (page - 1) * pageSize;
  const supabase = createServiceClient();

  let query = supabase
    .from('bank_statement_transactions')
    .select(
      `id, row_number, transaction_at, amount, direction, description,
       reference_number, counterparty_name, counterparty_account, match_status,
       match_confidence, match_reason, created_at,
       batch:bank_statement_batches!inner(id, bank_code, account_number_masked, file_name, imported_at),
       suggested_student:profiles!bank_statement_transactions_suggested_student_id_fkey(id, full_name, student_code),
       matched_payment:payments(id, receipt_number)`,
      { count: 'exact' }
    )
    .order('transaction_at', { ascending: false })
    .range(start, start + pageSize - 1);
  if (status !== 'all') query = query.eq('match_status', status);

  const { data: transactions, error, count } = await query;
  if (error) throw error;

  let students: StudentMatchCandidate[] = [];
  if (transactions?.some((item) => item.match_status === 'unmatched')) {
    const { data, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, student_code')
      .eq('role', 'student')
      .eq('is_active', true)
      .limit(5000);
    if (studentError) throw studentError;
    students = (data || []).map((student) => ({
      id: student.id,
      fullName: student.full_name,
      studentCode: student.student_code,
    }));
  }

  const rows = (transactions || []).map((transaction) => ({
    ...transaction,
    liveSuggestion:
      transaction.match_status === 'unmatched'
        ? suggestStudentMatch(
            {
              description: transaction.description,
              counterpartyName: transaction.counterparty_name,
            },
            students
          )
        : null,
  }));
  return apiPaginated(rows, { page, pageSize, total: count || 0 });
});
