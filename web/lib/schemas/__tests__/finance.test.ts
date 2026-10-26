import {
  cancelInvoiceSchema,
  confirmBankTransactionSchema,
  ignoreBankTransactionSchema,
  receiveStudentPaymentSchema,
  refundPaymentSchema,
  studentTuitionDiscountSchema,
  tuitionRateSchema,
} from '../requests/finance';

const ids = {
  student_id: '11111111-1111-4111-8111-111111111111',
  class_id: '22222222-2222-4222-8222-222222222222',
  academic_year_id: '33333333-3333-4333-8333-333333333333',
};

describe('finance configuration schemas', () => {
  it('requires an auditable reason when ignoring a bank transaction', () => {
    expect(ignoreBankTransactionSchema.safeParse({ reason: 'Giao dịch nội bộ' }).success).toBe(
      true
    );
    expect(ignoreBankTransactionSchema.safeParse({ reason: '  ' }).success).toBe(false);
  });

  it('validates a bank transaction confirmation request', () => {
    expect(
      confirmBankTransactionSchema.safeParse({
        student_id: ids.student_id,
        payment_method_id: '44444444-4444-4444-8444-444444444444',
        allocations: [{ invoice_id: '55555555-5555-4555-8555-555555555555', amount: 500_000 }],
        notes: 'Đã kiểm tra nội dung chuyển khoản',
      }).success
    ).toBe(true);
    expect(
      confirmBankTransactionSchema.safeParse({
        student_id: 'invalid',
        payment_method_id: '44444444-4444-4444-8444-444444444444',
      }).success
    ).toBe(false);
  });

  it('accepts a valid monthly class tuition rate', () => {
    expect(
      tuitionRateSchema.safeParse({
        class_id: ids.class_id,
        academic_year_id: ids.academic_year_id,
        monthly_amount: 1_200_000,
        effective_from: '2026-09-01',
      }).success
    ).toBe(true);
  });

  it('rejects an end date before the effective date', () => {
    expect(
      tuitionRateSchema.safeParse({
        class_id: ids.class_id,
        academic_year_id: ids.academic_year_id,
        monthly_amount: 1_200_000,
        effective_from: '2026-09-01',
        effective_to: '2026-08-31',
      }).success
    ).toBe(false);
  });

  it('rejects percentage discounts above 100 percent', () => {
    expect(
      studentTuitionDiscountSchema.safeParse({
        ...ids,
        discount_type: 'percentage',
        discount_value: 101,
        effective_from: '2026-09-01',
      }).success
    ).toBe(false);
  });

  it('requires a positive refund and an auditable reason', () => {
    expect(refundPaymentSchema.safeParse({ amount: 500_000, reason: 'Thu nhầm' }).success).toBe(
      true
    );
    expect(refundPaymentSchema.safeParse({ amount: 0, reason: 'x' }).success).toBe(false);
  });

  it('requires a cancellation reason', () => {
    expect(cancelInvoiceSchema.safeParse({ reason: 'Học viên chuyển lớp' }).success).toBe(true);
    expect(cancelInvoiceSchema.safeParse({ reason: '  ' }).success).toBe(false);
  });

  it('accepts one payment allocated across multiple invoices', () => {
    expect(
      receiveStudentPaymentSchema.safeParse({
        student_id: ids.student_id,
        amount: 1_000_000,
        payment_method_id: '44444444-4444-4444-8444-444444444444',
        allocations: [
          { invoice_id: '55555555-5555-4555-8555-555555555555', amount: 600_000 },
          { invoice_id: '66666666-6666-4666-8666-666666666666', amount: 300_000 },
        ],
      }).success
    ).toBe(true);
  });

  it('rejects over-allocation and duplicate invoices', () => {
    const base = {
      student_id: ids.student_id,
      amount: 500_000,
      payment_method_id: '44444444-4444-4444-8444-444444444444',
    };
    expect(
      receiveStudentPaymentSchema.safeParse({
        ...base,
        allocations: [{ invoice_id: '55555555-5555-4555-8555-555555555555', amount: 600_000 }],
      }).success
    ).toBe(false);
    expect(
      receiveStudentPaymentSchema.safeParse({
        ...base,
        allocations: [
          { invoice_id: '55555555-5555-4555-8555-555555555555', amount: 200_000 },
          { invoice_id: '55555555-5555-4555-8555-555555555555', amount: 200_000 },
        ],
      }).success
    ).toBe(false);
  });
});
