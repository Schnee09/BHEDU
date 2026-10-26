import { createLazyService } from './lazyService';

/**
 * Finance Service
 *
 * Implements business logic for managing student accounts, invoices, payments,
 * and bulk operations like tuition grid updates.
 * Aligned with BH-EDU v5.0 Architecture and SOLID principles.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import {
  FinanceRepository,
  Payment,
  FinanceOverview,
  InvoiceFilters,
} from '@/lib/repositories/FinanceRepository';
import { ValidationError, NotFoundError } from '@/lib/api/errors';
import {
  doesEnrollmentOverlapPeriod,
  getCalendarMonthPeriod,
} from '@/lib/enrollments/effectiveDates';

export class FinanceService {
  private supabase: SupabaseClient;
  private financeRepository: FinanceRepository;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
    this.financeRepository = new FinanceRepository(this.supabase);
  }

  private isMissingFinanceFoundation(error: { code?: string; message?: string } | null): boolean {
    return Boolean(
      error &&
      (error.code === '42703' ||
        error.code === 'PGRST204' ||
        error.message?.includes('billing_period') ||
        error.message?.includes('class_id'))
    );
  }

  /**
   * Set the Supabase client (primarily for testing)
   */
  public setSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.financeRepository = new FinanceRepository(supabase);
  }

  /**
   * Get overview financial statistics
   */
  async getOverview(academicYearId: string): Promise<FinanceOverview> {
    if (!academicYearId) {
      throw new ValidationError('Academic Year ID is required');
    }
    return this.financeRepository.getOverviewStats(academicYearId);
  }

  /**
   * Find paginated list of invoices with filters
   */
  async getInvoices(filters: InvoiceFilters) {
    return this.financeRepository.findInvoices(filters);
  }

  async getPaymentMethods() {
    return this.financeRepository.getPaymentMethods();
  }

  /**
   * Record a payment for an invoice
   */
  async payInvoice(
    invoiceId: string,
    paymentData: {
      payment_method_id: string;
      amount: number;
      reference_number?: string | null;
      payment_date?: string;
      notes?: string | null;
      received_by?: string | null;
    }
  ): Promise<Payment> {
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('student_id')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new NotFoundError('Hóa đơn không tồn tại');
    }

    return this.financeRepository.recordInvoicePayment({
      student_id: invoice.student_id,
      invoice_id: invoiceId,
      amount: paymentData.amount,
      payment_method_id: paymentData.payment_method_id,
      reference_number: paymentData.reference_number || null,
      payment_date: paymentData.payment_date,
      received_by: paymentData.received_by || null,
      notes: paymentData.notes || null,
    });
  }

  /**
   * Retrieve active class tuition matrix
   */
  async getTuitionMatrix(classId: string, academicYearId: string, months: string[]) {
    // 1. Fetch class details
    const { data: classObj } = await this.supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single();

    if (!classObj) {
      throw new NotFoundError('Lớp học không tồn tại');
    }

    const billingPeriods = months.map(getCalendarMonthPeriod);
    if (billingPeriods.length === 0) {
      return { students: [], matrix: {} };
    }
    const firstBillingPeriod = billingPeriods[0]!;

    const firstPeriodStart = billingPeriods.reduce(
      (earliest, period) => (period.start < earliest ? period.start : earliest),
      firstBillingPeriod.start
    );
    const lastPeriodEnd = billingPeriods.reduce(
      (latest, period) => (period.end > latest ? period.end : latest),
      firstBillingPeriod.end
    );

    // 2. Fetch enrollments overlapping the requested billing periods. Status alone
    // cannot represent historical membership after a student leaves or transfers.
    const { data: enrollments, error: enrollError } = await this.supabase
      .from('enrollments')
      .select(
        `
        student_id,
        enrollment_date,
        end_date,
        student:profiles!student_id(id, full_name, student_code)
      `
      )
      .eq('class_id', classId)
      .lte('enrollment_date', lastPeriodEnd)
      .or(`end_date.is.null,end_date.gte.${firstPeriodStart}`)
      .is('deleted_at', null);

    if (enrollError) {
      throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
    }

    const students = Array.from(
      new Map(
        (enrollments || [])
          .filter((e: any) =>
            billingPeriods.some((period) => doesEnrollmentOverlapPeriod(e, period))
          )
          .map((e: any) => [
            e.student.id,
            {
              id: e.student.id,
              full_name: e.student.full_name,
              student_code: e.student.student_code,
            },
          ])
      ).values()
    ).sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'));

    if (students.length === 0) {
      return { students: [], matrix: {} };
    }

    const studentIds = students.map((s) => s.id);

    // 3. Prefer the class-scoped billing period introduced by the finance
    // foundation. Keep a temporary legacy read fallback during rollout.
    let { data: invoices, error: invoiceError } = await this.supabase
      .from('invoices')
      .select('id, student_id, billing_period, due_date, total_amount, paid_amount, status')
      .in('student_id', studentIds)
      .eq('academic_year_id', academicYearId)
      .eq('class_id', classId)
      .in('billing_period', months);

    if (invoiceError && this.isMissingFinanceFoundation(invoiceError)) {
      const legacyResult = await this.supabase
        .from('invoices')
        .select('id, student_id, issue_date, due_date, total_amount, paid_amount, status')
        .in('student_id', studentIds)
        .eq('academic_year_id', academicYearId)
        .in('issue_date', months);
      invoices = legacyResult.data as any;
      invoiceError = legacyResult.error;
    }

    if (invoiceError) {
      throw new Error(`Failed to fetch invoices: ${invoiceError.message}`);
    }

    // 4. Map invoices into matrix dictionary
    // Structure: { [studentId]: { [month]: { invoiceId, status, total, paid } } }
    const matrix: Record<string, Record<string, any>> = {};
    const enrollmentPeriodsByStudent = new Map<string, any[]>();
    (enrollments || []).forEach((enrollment: any) => {
      const periods = enrollmentPeriodsByStudent.get(enrollment.student_id) || [];
      periods.push(enrollment);
      enrollmentPeriodsByStudent.set(enrollment.student_id, periods);
    });

    // Initialize student rows
    students.forEach((s) => {
      const studentMap: Record<string, any> = {};
      months.forEach((m) => {
        const billingPeriod = getCalendarMonthPeriod(m);
        const isApplicable = (enrollmentPeriodsByStudent.get(s.id) || []).some((enrollment) =>
          doesEnrollmentOverlapPeriod(enrollment, billingPeriod)
        );
        studentMap[m] = { status: isApplicable ? 'not_created' : 'not_applicable' };
      });
      matrix[s.id] = studentMap;
    });

    ((invoices || []) as any[]).forEach((inv) => {
      const month = inv.billing_period || inv.issue_date; // YYYY-MM-DD
      const studentRow = matrix[inv.student_id];
      if (studentRow && studentRow[month] !== undefined) {
        studentRow[month] = {
          invoiceId: inv.id,
          status: inv.status,
          total: inv.total_amount,
          paid: inv.paid_amount,
        };
      }
    });

    return { students, matrix };
  }

  /**
   * Determine tuition fee based on class name and configurations
   */
  private async determineMonthlyFee(classId: string, academicYearId: string): Promise<number> {
    // 1. Check fee_assignments
    const { data: assignment } = await this.supabase
      .from('fee_assignments')
      .select('amount')
      .eq('class_id', classId)
      .eq('academic_year_id', academicYearId)
      .eq('is_active', true)
      .maybeSingle();

    if (assignment) {
      return Number(assignment.amount);
    }

    // 2. Parse class name (e.g. "9T2 (1200k)", "Lớp 6T1 (800K)")
    const { data: classObj } = await this.supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single();

    if (classObj?.name) {
      const match = classObj.name.match(/(\d+)\s*k/i);
      if (match && match[1]) {
        return parseInt(match[1], 10) * 1000;
      }
    }

    // 3. Fallback default
    return 1200000; // 1,200,000 VND
  }

  /**
   * Bulk update tuition grid payment statuses
   */
  async updateTuitionMatrix(
    classId: string,
    academicYearId: string,
    updates: Array<{ studentId: string; month: string; paid: boolean }>
  ): Promise<{ success: boolean; updatedCount: number }> {
    const studentIds = [...new Set(updates.map((update) => update.studentId))];
    const months = [...new Set(updates.map((update) => update.month))];
    const billingPeriods = months.map(getCalendarMonthPeriod);

    if (updates.length === 0 || billingPeriods.length === 0) {
      throw new ValidationError('Cần có ít nhất một thay đổi học phí');
    }

    if (updates.some((update) => !update.paid)) {
      throw new ValidationError(
        'Không thể bỏ trạng thái đã đóng tại bảng học phí. Hãy dùng nghiệp vụ hoàn tiền và ghi rõ lý do để giữ lịch sử giao dịch'
      );
    }

    const firstPeriodStart = billingPeriods.reduce(
      (earliest, period) => (period.start < earliest ? period.start : earliest),
      billingPeriods[0]!.start
    );
    const lastPeriodEnd = billingPeriods.reduce(
      (latest, period) => (period.end > latest ? period.end : latest),
      billingPeriods[0]!.end
    );

    const { data: enrollments, error: enrollmentsError } = await this.supabase
      .from('enrollments')
      .select('student_id, enrollment_date, end_date')
      .eq('class_id', classId)
      .in('student_id', studentIds)
      .lte('enrollment_date', lastPeriodEnd)
      .or(`end_date.is.null,end_date.gte.${firstPeriodStart}`)
      .is('deleted_at', null);

    if (enrollmentsError) {
      throw new Error(`Failed to validate enrollments: ${enrollmentsError.message}`);
    }

    const enrollmentPeriodsByStudent = new Map<string, any[]>();
    (enrollments || []).forEach((enrollment) => {
      const periods = enrollmentPeriodsByStudent.get(enrollment.student_id) || [];
      periods.push(enrollment);
      enrollmentPeriodsByStudent.set(enrollment.student_id, periods);
    });

    const invalidUpdate = updates.find((update) => {
      const billingPeriod = getCalendarMonthPeriod(update.month);
      return !(enrollmentPeriodsByStudent.get(update.studentId) || []).some((enrollment) =>
        doesEnrollmentOverlapPeriod(enrollment, billingPeriod)
      );
    });

    if (invalidUpdate) {
      const monthLabel = `${Number(invalidUpdate.month.slice(5, 7))}/${invalidUpdate.month.slice(0, 4)}`;
      throw new ValidationError(
        `Không thể cập nhật học phí tháng ${monthLabel}: học sinh không học lớp này trong tháng đó`
      );
    }

    // Get cash payment method id. This matrix action explicitly records a cash
    // receipt; other methods must use the regular payment workflow.
    const { data: paymentMethods } = await this.supabase
      .from('payment_methods')
      .select('id')
      .eq('type', 'cash')
      .eq('is_active', true)
      .limit(1);

    const paymentMethodId = paymentMethods?.[0]?.id;

    if (!paymentMethodId) {
      throw new Error('Cash payment method is not configured in payment_methods table');
    }

    const existingInvoices = new Map<
      string,
      { id: string; total_amount: number; paid_amount: number; status: string }
    >();

    if (studentIds.length > 0 && months.length > 0) {
      let { data: invoices, error: invoicesError } = await this.supabase
        .from('invoices')
        .select('id, student_id, billing_period, total_amount, paid_amount, status')
        .eq('academic_year_id', academicYearId)
        .eq('class_id', classId)
        .in('student_id', studentIds)
        .in('billing_period', months);

      if (invoicesError && this.isMissingFinanceFoundation(invoicesError)) {
        const legacyResult = await this.supabase
          .from('invoices')
          .select('id, student_id, issue_date, total_amount, paid_amount, status')
          .eq('academic_year_id', academicYearId)
          .in('student_id', studentIds)
          .in('issue_date', months);
        invoices = legacyResult.data as any;
        invoicesError = legacyResult.error;
      }

      if (invoicesError) {
        throw new Error(`Failed to fetch existing invoices: ${invoicesError.message}`);
      }

      for (const invoice of (invoices || []) as any[]) {
        existingInvoices.set(
          `${invoice.student_id}:${invoice.billing_period || invoice.issue_date}`,
          invoice
        );
      }
    }

    let updatedCount = 0;

    for (const update of updates) {
      const { studentId, month, paid } = update;
      const existingInvoice = existingInvoices.get(`${studentId}:${month}`);

      if (existingInvoice) {
        if (paid && existingInvoice.status !== 'paid') {
          // Record payment for remaining balance
          const balance =
            Number(existingInvoice.total_amount) - Number(existingInvoice.paid_amount);
          if (balance > 0) {
            await this.financeRepository.recordInvoicePayment({
              student_id: studentId,
              invoice_id: existingInvoice.id,
              amount: balance,
              payment_method_id: paymentMethodId,
              notes: 'Thanh toán học phí qua cổng học viên',
            });
            existingInvoices.set(`${studentId}:${month}`, {
              ...existingInvoice,
              paid_amount: Number(existingInvoice.total_amount),
              status: 'paid',
            });
            updatedCount++;
          }
        }
      } else {
        // If invoice doesn't exist and we want to set it to paid/unpaid
        const dueDate =
          new Date(new Date(month).getTime() + 15 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0] || ''; // Due 15 days later

        // Create invoice
        const invoice = await this.financeRepository.createMonthlyTuitionInvoice({
          student_id: studentId,
          class_id: classId,
          academic_year_id: academicYearId,
          billing_period: month,
          due_date: dueDate,
          description: `Học phí tháng ${new Date(month).getMonth() + 1}/${new Date(month).getFullYear()}`,
          notes: 'Hóa đơn học phí tự động sinh từ Portal',
        });

        // Record payment if paid is true
        if (paid) {
          await this.financeRepository.recordInvoicePayment({
            student_id: studentId,
            invoice_id: invoice.id,
            // Pay the actual amount after the effective rate and student
            // discount have been resolved atomically by the invoice RPC.
            amount: Number(invoice.total_amount),
            payment_method_id: paymentMethodId,
            notes: 'Ghi nhận tiền mặt từ bảng học phí',
          });
        }
        existingInvoices.set(`${studentId}:${month}`, {
          id: invoice.id,
          total_amount: Number(invoice.total_amount),
          paid_amount: paid ? Number(invoice.total_amount) : 0,
          status: paid ? 'paid' : 'pending',
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  }

  /**
   * Bulk generate invoices for a class for a specific month
   */
  async bulkGenerateClassInvoices(
    classId: string,
    academicYearId: string,
    month: string,
    dueDate: string,
    amount?: number,
    description?: string
  ): Promise<{ success: boolean; generatedCount: number }> {
    // 1. Fetch class details
    const { data: classObj } = await this.supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single();

    if (!classObj) {
      throw new NotFoundError('Lớp học không tồn tại');
    }

    const billingPeriod = getCalendarMonthPeriod(month);

    // 3. Include every enrollment overlapping this month, including students
    // who have since left or transferred. Exclude students who join later.
    const { data: enrollments, error: enrollmentsError } = await this.supabase
      .from('enrollments')
      .select('student_id, enrollment_date, end_date')
      .eq('class_id', classId)
      .lte('enrollment_date', billingPeriod.end)
      .or(`end_date.is.null,end_date.gte.${billingPeriod.start}`)
      .is('deleted_at', null);

    if (enrollmentsError) {
      throw new Error(`Failed to fetch enrollments: ${enrollmentsError.message}`);
    }

    const billableEnrollments = Array.from(
      new Map(
        (enrollments || [])
          .filter((enrollment) => doesEnrollmentOverlapPeriod(enrollment, billingPeriod))
          .map((enrollment) => [enrollment.student_id, enrollment])
      ).values()
    );

    if (billableEnrollments.length === 0) {
      return { success: true, generatedCount: 0 };
    }

    const studentIds = billableEnrollments.map((enrollment) => enrollment.student_id);
    let { data: existingInvoices, error: invoicesError } = await this.supabase
      .from('invoices')
      .select('student_id')
      .eq('academic_year_id', academicYearId)
      .eq('class_id', classId)
      .eq('billing_period', month)
      .in('student_id', studentIds);

    if (invoicesError && this.isMissingFinanceFoundation(invoicesError)) {
      const legacyResult = await this.supabase
        .from('invoices')
        .select('student_id')
        .eq('academic_year_id', academicYearId)
        .eq('issue_date', month)
        .in('student_id', studentIds);
      existingInvoices = legacyResult.data;
      invoicesError = legacyResult.error;
    }

    if (invoicesError) {
      throw new Error(`Failed to fetch existing invoices: ${invoicesError.message}`);
    }

    const invoicedStudentIds = new Set(
      (existingInvoices || []).map((invoice) => invoice.student_id)
    );
    let generatedCount = 0;

    for (const enrollment of billableEnrollments) {
      const studentId = enrollment.student_id;

      if (!invoicedStudentIds.has(studentId)) {
        const descMonth = new Date(month).getMonth() + 1;
        const descYear = new Date(month).getFullYear();
        const finalDesc =
          description || `Học phí Lớp ${classObj.name} - Tháng ${descMonth}/${descYear}`;

        await this.financeRepository.createMonthlyTuitionInvoice({
          student_id: studentId,
          class_id: classId,
          academic_year_id: academicYearId,
          billing_period: month,
          due_date: dueDate,
          // Leave this empty unless the operator explicitly overrides the amount.
          // The transaction RPC then selects the effective-dated class rate and
          // applies the student's effective discount for this billing period.
          gross_amount: amount,
          description: finalDesc,
          notes: `Hóa đơn hàng loạt tạo cho lớp ${classObj.name}`,
        });
        generatedCount++;
      }
    }

    return { success: true, generatedCount };
  }
}

export const financeService = createLazyService(() => new FinanceService());
