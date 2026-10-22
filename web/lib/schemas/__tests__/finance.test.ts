import {
  cancelInvoiceSchema,
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
});
