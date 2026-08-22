/**
 * Finance Service
 *
 * Implements business logic for managing student accounts, invoices, payments,
 * and bulk operations like tuition grid updates.
 * Aligned with BH-EDU v5.0 Architecture and SOLID principles.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { FinanceRepository, Invoice, Payment, StudentAccount, FinanceOverview, InvoiceFilters } from "@/lib/repositories/FinanceRepository";
import { ValidationError, NotFoundError } from "@/lib/api/errors";

export class FinanceService {
  private supabase: SupabaseClient;
  private financeRepository: FinanceRepository;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
    this.financeRepository = new FinanceRepository(this.supabase);
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
      throw new ValidationError("Academic Year ID is required");
    }
    return this.financeRepository.getOverviewStats(academicYearId);
  }

  /**
   * Find paginated list of invoices with filters
   */
  async getInvoices(filters: InvoiceFilters) {
    return this.financeRepository.findInvoices(filters);
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
      .from("invoices")
      .select("student_id")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      throw new NotFoundError("Hóa đơn không tồn tại");
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
      .from("classes")
      .select("name")
      .eq("id", classId)
      .single();

    if (!classObj) {
      throw new NotFoundError("Lớp học không tồn tại");
    }

    // 2. Fetch all active student enrollments
    const { data: enrollments, error: enrollError } = await this.supabase
      .from("enrollments")
      .select(`
        student_id,
        student:profiles!student_id(id, full_name, student_code)
      `)
      .eq("class_id", classId)
      .eq("status", "enrolled");

    if (enrollError) {
      throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
    }

    const students = (enrollments || []).map((e: any) => ({
      id: e.student.id,
      full_name: e.student.full_name,
      student_code: e.student.student_code,
    })).sort((a, b) => a.full_name.localeCompare(b.full_name, "vi"));

    if (students.length === 0) {
      return { students: [], matrix: {} };
    }

    const studentIds = students.map((s) => s.id);

    // 3. Fetch all invoices for these students matching issue_date (months)
    const { data: invoices, error: invoiceError } = await this.supabase
      .from("invoices")
      .select("id, student_id, issue_date, due_date, total_amount, paid_amount, status")
      .in("student_id", studentIds)
      .eq("academic_year_id", academicYearId)
      .in("issue_date", months);

    if (invoiceError) {
      throw new Error(`Failed to fetch invoices: ${invoiceError.message}`);
    }

    // 4. Map invoices into matrix dictionary
    // Structure: { [studentId]: { [month]: { invoiceId, status, total, paid } } }
    const matrix: Record<string, Record<string, any>> = {};
    
    // Initialize student rows
    students.forEach((s) => {
      const studentMap: Record<string, any> = {};
      months.forEach((m) => {
        studentMap[m] = { status: "not_created" };
      });
      matrix[s.id] = studentMap;
    });

    invoices?.forEach((inv) => {
      const month = inv.issue_date; // YYYY-MM-DD
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
      .from("fee_assignments")
      .select("amount")
      .eq("class_id", classId)
      .eq("academic_year_id", academicYearId)
      .eq("is_active", true)
      .maybeSingle();

    if (assignment) {
      return Number(assignment.amount);
    }

    // 2. Parse class name (e.g. "9T2 (1200k)", "Lớp 6T1 (800K)")
    const { data: classObj } = await this.supabase
      .from("classes")
      .select("name")
      .eq("id", classId)
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
    // 1. Get default invoice details
    const monthlyFee = await this.determineMonthlyFee(classId, academicYearId);
    
    // Get cash payment method id
    const { data: paymentMethods } = await this.supabase
      .from("payment_methods")
      .select("id")
      .eq("type", "cash")
      .eq("is_active", true)
      .limit(1);
    
    const paymentMethodId = paymentMethods?.[0]?.id;

    if (!paymentMethodId) {
      throw new Error("Cash payment method is not configured in payment_methods table");
    }

    let updatedCount = 0;

    for (const update of updates) {
      const { studentId, month, paid } = update;

      // Check if invoice already exists for this student and month
      const { data: existingInvoice } = await this.supabase
        .from("invoices")
        .select("id, total_amount, paid_amount, status")
        .eq("student_id", studentId)
        .eq("academic_year_id", academicYearId)
        .eq("issue_date", month)
        .maybeSingle();

      if (existingInvoice) {
        if (paid && existingInvoice.status !== "paid") {
          // Record payment for remaining balance
          const balance = Number(existingInvoice.total_amount) - Number(existingInvoice.paid_amount);
          if (balance > 0) {
            await this.financeRepository.recordInvoicePayment({
              student_id: studentId,
              invoice_id: existingInvoice.id,
              amount: balance,
              payment_method_id: paymentMethodId,
              notes: "Thanh toán học phí qua Portal (Bảng điều khiển)",
            });
            updatedCount++;
          }
        } else if (!paid && existingInvoice.status === "paid") {
          // Revert payment: Set paid_amount to 0, status to pending, and delete payment allocations/records
          // 1. Delete allocations
          await this.supabase
            .from("payment_allocations")
            .delete()
            .eq("invoice_id", existingInvoice.id);

          // 2. Delete payment records for this invoice
          await this.supabase
            .from("payments")
            .delete()
            .eq("invoice_id", existingInvoice.id);

          // 3. Update invoice status
          await this.supabase
            .from("invoices")
            .update({
              paid_amount: 0,
              status: "pending",
            })
            .eq("id", existingInvoice.id);

          // 4. Update student account balance
          const { data: account } = await this.supabase
            .from("student_accounts")
            .select("*")
            .eq("student_id", studentId)
            .eq("academic_year_id", academicYearId)
            .maybeSingle();

          if (account) {
            const newTotalPaid = Math.max(0, Number(account.total_paid) - Number(existingInvoice.total_amount));
            const newBalance = Number(account.balance) + Number(existingInvoice.total_amount);

            await this.supabase
              .from("student_accounts")
              .update({
                total_paid: newTotalPaid,
                balance: newBalance,
              })
              .eq("id", account.id);
          }
          updatedCount++;
        }
      } else {
        // If invoice doesn't exist and we want to set it to paid/unpaid
        const dueDate = new Date(new Date(month).getTime() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] || ""; // Due 15 days later

        // Create invoice
        const invoice = await this.financeRepository.createInvoiceWithItems(
          {
            student_id: studentId,
            academic_year_id: academicYearId,
            issue_date: month,
            due_date: dueDate,
            total_amount: monthlyFee,
            notes: "Hóa đơn học phí tự động sinh từ Portal",
          },
          [
            {
              description: `Học phí tháng ${new Date(month).getMonth() + 1}/${new Date(month).getFullYear()}`,
              quantity: 1,
              unit_price: monthlyFee,
            },
          ]
        );

        // Record payment if paid is true
        if (paid) {
          await this.financeRepository.recordInvoicePayment({
            student_id: studentId,
            invoice_id: invoice.id,
            amount: monthlyFee,
            payment_method_id: paymentMethodId,
            notes: "Thanh toán học phí qua Portal",
          });
        }
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
      .from("classes")
      .select("name")
      .eq("id", classId)
      .single();

    if (!classObj) {
      throw new NotFoundError("Lớp học không tồn tại");
    }

    // 2. Determine monthly fee if not overridden
    const monthlyFee = amount !== undefined ? amount : await this.determineMonthlyFee(classId, academicYearId);

    // 3. Fetch active student enrollments
    const { data: enrollments } = await this.supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .eq("status", "enrolled");

    if (!enrollments || enrollments.length === 0) {
      return { success: true, generatedCount: 0 };
    }

    let generatedCount = 0;

    for (const enrollment of enrollments) {
      const studentId = enrollment.student_id;

      // Check if invoice already exists for this student and month
      const { data: existingInvoice } = await this.supabase
        .from("invoices")
        .select("id")
        .eq("student_id", studentId)
        .eq("academic_year_id", academicYearId)
        .eq("issue_date", month)
        .maybeSingle();

      if (!existingInvoice) {
        const descMonth = new Date(month).getMonth() + 1;
        const descYear = new Date(month).getFullYear();
        const finalDesc = description || `Học phí Lớp ${classObj.name} - Tháng ${descMonth}/${descYear}`;

        await this.financeRepository.createInvoiceWithItems(
          {
            student_id: studentId,
            academic_year_id: academicYearId,
            issue_date: month,
            due_date: dueDate,
            total_amount: monthlyFee,
            notes: `Hóa đơn hàng loạt tạo cho lớp ${classObj.name}`,
          },
          [
            {
              description: finalDesc,
              quantity: 1,
              unit_price: monthlyFee,
            },
          ]
        );
        generatedCount++;
      }
    }

    return { success: true, generatedCount };
  }
}

export const financeService = new FinanceService();
