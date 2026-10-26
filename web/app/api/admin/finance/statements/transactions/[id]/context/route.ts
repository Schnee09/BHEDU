import { apiSuccess, createGetHandler } from '@/lib/api';
import { NotFoundError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler<{ id: string }>(
  { permission: 'finance.view' },
  async ({ params, searchParams }) => {
    const supabase = createServiceClient();
    const studentId = searchParams.get('student_id');
    const search = searchParams.get('search')?.trim().slice(0, 80) || '';

    const { data: transaction, error: transactionError } = await supabase
      .from('bank_statement_transactions')
      .select('id, amount, direction, description, transaction_at, match_status')
      .eq('id', params.id)
      .single();
    if (transactionError || !transaction) throw new NotFoundError('Không tìm thấy giao dịch');

    let studentQuery = supabase
      .from('profiles')
      .select('id, full_name, student_code')
      .eq('role', 'student')
      .eq('is_active', true)
      .order('full_name')
      .limit(20);
    if (studentId) studentQuery = studentQuery.eq('id', studentId);
    else if (search) {
      const safeSearch = search.replace(/[%_,()]/g, ' ').trim();
      studentQuery = studentQuery.or(
        `full_name.ilike.%${safeSearch}%,student_code.ilike.%${safeSearch}%`
      );
    }
    const { data: students, error: studentError } = await studentQuery;
    if (studentError) throw studentError;

    let invoices: unknown[] = [];
    if (studentId) {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, billing_period, due_date, total_amount, paid_amount, status')
        .eq('student_id', studentId)
        .not('status', 'in', '(paid,cancelled,refunded)')
        .order('due_date');
      if (error) throw error;
      invoices = data || [];
    }

    return apiSuccess({ transaction, students: students || [], invoices });
  }
);
