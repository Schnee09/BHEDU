import { ValidationError } from '@/lib/api/errors';
import { FinanceService } from '@/lib/services/financeService';

describe('FinanceService enrollment safeguards', () => {
  it('delegates the effective tuition rate to the RPC when no manual override is supplied', async () => {
    const classQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    };
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockReturnValue(classQuery);
    classQuery.single.mockResolvedValue({ data: { name: 'Lớp 9T2' }, error: null });

    const enrollmentQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      lte: jest.fn(),
      or: jest.fn(),
      is: jest.fn(),
    };
    enrollmentQuery.select.mockReturnValue(enrollmentQuery);
    enrollmentQuery.eq.mockReturnValue(enrollmentQuery);
    enrollmentQuery.lte.mockReturnValue(enrollmentQuery);
    enrollmentQuery.or.mockReturnValue(enrollmentQuery);
    enrollmentQuery.is.mockResolvedValue({
      data: [{ student_id: 'student-1', enrollment_date: '2026-09-01', end_date: null }],
      error: null,
    });

    const invoiceQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
    };
    invoiceQuery.select.mockReturnValue(invoiceQuery);
    invoiceQuery.eq.mockReturnValue(invoiceQuery);
    invoiceQuery.in.mockResolvedValue({ data: [], error: null });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'classes') return classQuery;
        if (table === 'enrollments') return enrollmentQuery;
        if (table === 'invoices') return invoiceQuery;
        throw new Error(`Unexpected table access: ${table}`);
      }),
    } as any;
    const createMonthlyTuitionInvoice = jest.fn().mockResolvedValue({ id: 'invoice-1' });
    const service = new FinanceService(supabase);
    (service as any).financeRepository = { createMonthlyTuitionInvoice };
    const determineMonthlyFee = jest.spyOn(service as any, 'determineMonthlyFee');

    await expect(
      service.bulkGenerateClassInvoices('class-1', 'year-1', '2026-10-01', '2026-10-15')
    ).resolves.toEqual({ success: true, generatedCount: 1 });

    expect(determineMonthlyFee).not.toHaveBeenCalled();
    expect(createMonthlyTuitionInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: 'student-1',
        gross_amount: undefined,
      })
    );
  });

  it('rejects clearing a paid state because payments require a refund trail', async () => {
    const supabase = {
      from: jest.fn(),
    } as any;

    const service = new FinanceService(supabase);

    await expect(
      service.updateTuitionMatrix('class-1', 'year-1', [
        {
          studentId: 'student-1',
          month: '2026-10-01',
          paid: false,
        },
      ])
    ).rejects.toEqual(
      new ValidationError(
        'Không thể bỏ trạng thái đã đóng tại bảng học phí. Hãy dùng nghiệp vụ hoàn tiền và ghi rõ lý do để giữ lịch sử giao dịch'
      )
    );

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('rejects a tuition matrix update outside the student enrollment period', async () => {
    const enrollmentQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      lte: jest.fn(),
      or: jest.fn(),
      is: jest.fn(),
    };
    enrollmentQuery.select.mockReturnValue(enrollmentQuery);
    enrollmentQuery.eq.mockReturnValue(enrollmentQuery);
    enrollmentQuery.in.mockReturnValue(enrollmentQuery);
    enrollmentQuery.lte.mockReturnValue(enrollmentQuery);
    enrollmentQuery.or.mockReturnValue(enrollmentQuery);
    enrollmentQuery.is.mockResolvedValue({ data: [], error: null });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'enrollments') return enrollmentQuery;
        throw new Error(`Unexpected table access: ${table}`);
      }),
    } as any;

    const service = new FinanceService(supabase);

    await expect(
      service.updateTuitionMatrix('class-1', 'year-1', [
        {
          studentId: 'student-1',
          month: '2026-10-01',
          paid: true,
        },
      ])
    ).rejects.toEqual(
      new ValidationError(
        'Không thể cập nhật học phí tháng 10/2026: học sinh không học lớp này trong tháng đó'
      )
    );

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('enrollments');
  });

  it('records the discounted invoice total instead of the gross tuition amount', async () => {
    const enrollmentQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      lte: jest.fn(),
      or: jest.fn(),
      is: jest.fn(),
    };
    enrollmentQuery.select.mockReturnValue(enrollmentQuery);
    enrollmentQuery.eq.mockReturnValue(enrollmentQuery);
    enrollmentQuery.in.mockReturnValue(enrollmentQuery);
    enrollmentQuery.lte.mockReturnValue(enrollmentQuery);
    enrollmentQuery.or.mockReturnValue(enrollmentQuery);
    enrollmentQuery.is.mockResolvedValue({
      data: [{ student_id: 'student-1', enrollment_date: '2026-09-01', end_date: null }],
      error: null,
    });

    const paymentMethodQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      limit: jest.fn(),
    };
    paymentMethodQuery.select.mockReturnValue(paymentMethodQuery);
    paymentMethodQuery.eq.mockReturnValue(paymentMethodQuery);
    paymentMethodQuery.limit.mockResolvedValue({ data: [{ id: 'cash-1' }], error: null });

    const invoiceQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
    };
    invoiceQuery.select.mockReturnValue(invoiceQuery);
    invoiceQuery.eq.mockReturnValue(invoiceQuery);
    invoiceQuery.in.mockImplementation(() => invoiceQuery);
    (invoiceQuery as any).then = (resolve: (value: unknown) => void) =>
      resolve({ data: [], error: null });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'enrollments') return enrollmentQuery;
        if (table === 'payment_methods') return paymentMethodQuery;
        if (table === 'invoices') return invoiceQuery;
        throw new Error(`Unexpected table access: ${table}`);
      }),
    } as any;
    const createMonthlyTuitionInvoice = jest.fn().mockResolvedValue({
      id: 'invoice-1',
      total_amount: 900_000,
    });
    const recordInvoicePayment = jest.fn().mockResolvedValue({ id: 'payment-1' });
    const service = new FinanceService(supabase);
    (service as any).financeRepository = {
      createMonthlyTuitionInvoice,
      recordInvoicePayment,
    };

    await expect(
      service.updateTuitionMatrix('class-1', 'year-1', [
        { studentId: 'student-1', month: '2026-10-01', paid: true },
      ])
    ).resolves.toEqual({ success: true, updatedCount: 1 });

    expect(createMonthlyTuitionInvoice).toHaveBeenCalledWith(
      expect.not.objectContaining({ gross_amount: expect.anything() })
    );
    expect(recordInvoicePayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 900_000, payment_method_id: 'cash-1' })
    );
  });
});
