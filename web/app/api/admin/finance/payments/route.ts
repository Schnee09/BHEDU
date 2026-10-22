import { apiPaginated, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const academicYearId = searchParams.get('academic_year_id');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const start = (page - 1) * pageSize;

  let query = createServiceClient()
    .from('payments')
    .select(
      `
        id, receipt_number, amount, refunded_amount, payment_date, status,
        reference_number, notes, created_at,
        student:profiles!payments_student_id_fkey(id, full_name, student_code),
        payment_method:payment_methods(id, name, type),
        invoice:invoices!inner(id, invoice_number, academic_year_id, total_amount),
        refunds:payment_refunds(id, refund_number, amount, reason, refunded_at)
      `,
      { count: 'exact' }
    )
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);

  if (academicYearId) query = query.eq('invoice.academic_year_id', academicYearId);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

  return apiPaginated(data || [], { page, pageSize, total: count || 0 });
});
