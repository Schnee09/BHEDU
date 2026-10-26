import { FinanceRepository } from '../FinanceRepository';

describe('FinanceRepository atomic operations', () => {
  it('creates a class-scoped monthly invoice through the transaction RPC', async () => {
    const invoice = { id: 'invoice-1', class_id: 'class-1', billing_period: '2026-10-01' };
    const rpc = jest.fn().mockResolvedValue({ data: invoice, error: null });
    const repository = new FinanceRepository({ rpc } as any);

    const result = await repository.createMonthlyTuitionInvoice({
      student_id: 'student-1',
      class_id: 'class-1',
      academic_year_id: 'year-1',
      billing_period: '2026-10-01',
      due_date: '2026-10-15',
      gross_amount: 1_200_000,
    });

    expect(result).toBe(invoice);
    expect(rpc).toHaveBeenCalledWith('create_monthly_tuition_invoice', {
      p_student_id: 'student-1',
      p_class_id: 'class-1',
      p_academic_year_id: 'year-1',
      p_billing_period: '2026-10-01',
      p_due_date: '2026-10-15',
      p_gross_amount: 1_200_000,
      p_discount_amount: null,
      p_description: null,
      p_notes: null,
    });
  });

  it('records a payment through the transaction RPC and accepts row arrays', async () => {
    const payment = { id: 'payment-1', receipt_number: 'BH-PT-2026-000001' };
    const rpc = jest.fn().mockResolvedValue({ data: [payment], error: null });
    const repository = new FinanceRepository({ rpc } as any);

    const result = await repository.recordInvoicePayment({
      student_id: 'student-1',
      invoice_id: 'invoice-1',
      amount: 500_000,
      payment_method_id: 'method-1',
    });

    expect(result).toBe(payment);
    expect(rpc).toHaveBeenCalledWith('record_invoice_payment_atomic', {
      p_invoice_id: 'invoice-1',
      p_amount: 500_000,
      p_payment_method_id: 'method-1',
      p_reference_number: null,
      p_payment_date: null,
      p_received_by: null,
      p_notes: null,
    });
  });

  it('records one student payment with multiple invoice allocations', async () => {
    const payment = { id: 'payment-2', amount: 900_000, status: 'completed' };
    const rpc = jest.fn().mockResolvedValue({ data: payment, error: null });
    const repository = new FinanceRepository({ rpc } as any);

    const result = await repository.receiveStudentPayment({
      student_id: 'student-1',
      amount: 900_000,
      payment_method_id: 'method-1',
      allocations: [
        { invoice_id: 'invoice-1', amount: 500_000 },
        { invoice_id: 'invoice-2', amount: 300_000 },
      ],
    });

    expect(result).toBe(payment);
    expect(rpc).toHaveBeenCalledWith('record_student_payment_atomic', {
      p_student_id: 'student-1',
      p_amount: 900_000,
      p_payment_method_id: 'method-1',
      p_allocations: [
        { invoice_id: 'invoice-1', amount: 500_000 },
        { invoice_id: 'invoice-2', amount: 300_000 },
      ],
      p_reference_number: null,
      p_payment_date: null,
      p_received_by: null,
      p_notes: null,
    });
  });

  it('allocates an existing payment without creating another receipt', async () => {
    const payment = { id: 'payment-2', status: 'completed' };
    const rpc = jest.fn().mockResolvedValue({ data: payment, error: null });
    const repository = new FinanceRepository({ rpc } as any);
    const allocations = [{ invoice_id: 'invoice-3', amount: 100_000 }];

    await expect(repository.allocateStudentPayment('payment-2', allocations)).resolves.toBe(
      payment
    );
    expect(rpc).toHaveBeenCalledWith('allocate_student_payment_atomic', {
      p_payment_id: 'payment-2',
      p_allocations: allocations,
    });
  });
});
