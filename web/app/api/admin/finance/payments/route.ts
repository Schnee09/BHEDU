import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { FinanceRepository } from '@/lib/repositories/FinanceRepository';
import { receiveStudentPaymentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const academicYearId = searchParams.get('academic_year_id');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const start = (page - 1) * pageSize;

  const supabase = createServiceClient();
  let paymentIds: string[] | null = null;

  if (academicYearId) {
    const { data: allocations, error: allocationError } = await supabase
      .from('payment_allocations')
      .select('payment_id, invoice:invoices!inner(academic_year_id)')
      .eq('invoice.academic_year_id', academicYearId);
    if (allocationError) throw new Error(`Failed to filter payments: ${allocationError.message}`);
    paymentIds = [...new Set((allocations || []).map((row) => row.payment_id))];
    if (paymentIds.length === 0) return apiPaginated([], { page, pageSize, total: 0 });
  }

  let query = supabase
    .from('payments')
    .select(
      `
        id, receipt_number, amount, refunded_amount, payment_date, status,
        reference_number, notes, created_at,
        student:profiles!payments_student_id_fkey(id, full_name, student_code),
        payment_method:payment_methods(id, name, type),
        invoice:invoices(id, invoice_number, academic_year_id, total_amount),
        allocations:payment_allocations(id, amount, invoice:invoices(id, invoice_number, academic_year_id, total_amount, paid_amount, status)),
        refunds:payment_refunds(id, refund_number, amount, reason, refunded_at)
      `,
      { count: 'exact' }
    )
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(start, start + pageSize - 1);

  if (paymentIds) query = query.in('id', paymentIds);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

  return apiPaginated(data || [], { page, pageSize, total: count || 0 });
});

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: receiveStudentPaymentSchema },
  async ({ body, user }) => {
    const repository = new FinanceRepository(createServiceClient());
    const payment = await repository.receiveStudentPayment({
      ...body,
      received_by: user.id,
    });
    return apiSuccess(payment, { _status: 201 });
  }
);
