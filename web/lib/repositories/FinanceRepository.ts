/**
 * Finance Repository
 *
 * Handles all database operations for tuition, invoices, and payments.
 * Aligned with BH-EDU v5.0 Architecture and SOLID principles.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, PaginatedResult } from "./base";

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  student_account_id: string;
  academic_year_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: "draft" | "pending" | "partial" | "paid" | "overdue" | "cancelled" | "sent" | "refunded";
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    student_code: string | null;
  };
}

export interface Payment {
  id: string;
  student_id: string;
  invoice_id: string | null;
  payment_method_id: string;
  amount: number;
  reference_number: string | null;
  payment_date: string;
  received_by: string | null;
  notes: string | null;
  status: "pending" | "received" | "verified" | "cancelled" | "completed" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
  payment_method?: {
    name: string;
  };
}

export interface StudentAccount {
  id: string;
  student_id: string;
  academic_year_id: string;
  balance: number;
  total_fees: number;
  total_paid: number;
  status: "active" | "inactive" | "graduated";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceOverview {
  totalInvoiced: number;
  totalPaid: number;
  totalDebt: number;
  paymentRate: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}

export interface InvoiceFilters {
  search?: string; // Student name or code
  classId?: string;
  status?: string;
  month?: string; // YYYY-MM
  academicYearId?: string;
  page?: number;
  pageSize?: number;
}

export class FinanceRepository extends BaseRepository<Invoice, any, any> {
  protected readonly tableName = "invoices";
  protected readonly primaryKey = "id";

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Get or create a student financial account for an academic year
   */
  async getOrCreateStudentAccount(
    studentId: string,
    academicYearId: string
  ): Promise<StudentAccount> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("student_accounts")
      .select("*")
      .eq("student_id", studentId)
      .eq("academic_year_id", academicYearId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch student account: ${fetchError.message}`);
    }

    if (existing) {
      return existing as StudentAccount;
    }

    const { data: created, error: insertError } = await this.supabase
      .from("student_accounts")
      .insert({
        student_id: studentId,
        academic_year_id: academicYearId,
        balance: 0,
        total_fees: 0,
        total_paid: 0,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create student account: ${insertError.message}`);
    }

    return created as StudentAccount;
  }

  /**
   * Create an invoice with items and update student account totals
   */
  async createInvoiceWithItems(
    invoiceInput: {
      student_id: string;
      academic_year_id: string;
      issue_date?: string;
      due_date: string;
      total_amount: number;
      notes?: string | null;
    },
    items: Array<{
      fee_type_id?: string | null;
      description: string;
      quantity: number;
      unit_price: number;
    }>
  ): Promise<Invoice> {
    // 1. Get or create student account
    const account = await this.getOrCreateStudentAccount(
      invoiceInput.student_id,
      invoiceInput.academic_year_id
    );

    // 2. Generate invoice number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const invoiceNumber = `INV-${timestamp}-${random}`;

    // 3. Create invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        student_id: invoiceInput.student_id,
        student_account_id: account.id,
        academic_year_id: invoiceInput.academic_year_id,
        issue_date: invoiceInput.issue_date || new Date().toISOString().split("T")[0],
        due_date: invoiceInput.due_date,
        total_amount: invoiceInput.total_amount,
        paid_amount: 0,
        status: "pending",
        notes: invoiceInput.notes || null,
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // 4. Create items
    const invoiceItems = items.map((item) => ({
      invoice_id: invoice.id,
      fee_type_id: item.fee_type_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await this.supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      // Clean up invoice if items fail
      await this.supabase.from("invoices").delete().eq("id", invoice.id);
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }

    // 5. Update student account totals
    const newTotalFees = Number(account.total_fees) + invoiceInput.total_amount;
    const newBalance = Number(account.balance) + invoiceInput.total_amount;

    const { error: accountError } = await this.supabase
      .from("student_accounts")
      .update({
        total_fees: newTotalFees,
        balance: newBalance,
      })
      .eq("id", account.id);

    if (accountError) {
      console.error("Warning: Failed to update student account totals:", accountError.message);
    }

    return invoice as Invoice;
  }

  /**
   * Record a payment, allocate it to an invoice, and update totals
   */
  async recordInvoicePayment(paymentInput: {
    student_id: string;
    invoice_id: string;
    amount: number;
    payment_method_id: string;
    reference_number?: string | null;
    payment_date?: string;
    notes?: string | null;
    received_by?: string | null;
  }): Promise<Payment> {
    // 1. Verify invoice exists
    const { data: invoice, error: invoiceFetchError } = await this.supabase
      .from("invoices")
      .select("*")
      .eq("id", paymentInput.invoice_id)
      .single();

    if (invoiceFetchError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceFetchError?.message || "Invalid ID"}`);
    }

    // 2. Record payment
    const { data: payment, error: paymentError } = await this.supabase
      .from("payments")
      .insert({
        student_id: paymentInput.student_id,
        invoice_id: paymentInput.invoice_id,
        payment_method_id: paymentInput.payment_method_id,
        amount: paymentInput.amount,
        reference_number: paymentInput.reference_number || null,
        payment_date: paymentInput.payment_date || new Date().toISOString().split("T")[0],
        received_by: paymentInput.received_by || null,
        notes: paymentInput.notes || null,
        status: "completed",
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    // 3. Record allocation
    await this.supabase.from("payment_allocations").insert({
      payment_id: payment.id,
      invoice_id: paymentInput.invoice_id,
      amount: paymentInput.amount,
    });

    // 4. Update invoice status & paid amount
    const newPaidAmount = Number(invoice.paid_amount) + paymentInput.amount;
    const isPaid = newPaidAmount >= Number(invoice.total_amount);
    const invoiceStatus = isPaid ? "paid" : "partial";

    await this.supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        status: invoiceStatus,
      })
      .eq("id", invoice.id);

    // 5. Update student account
    const { data: account } = await this.supabase
      .from("student_accounts")
      .select("*")
      .eq("student_id", paymentInput.student_id)
      .eq("academic_year_id", invoice.academic_year_id)
      .maybeSingle();

    if (account) {
      const newTotalPaid = Number(account.total_paid) + paymentInput.amount;
      const newBalance = Math.max(0, Number(account.balance) - paymentInput.amount);

      await this.supabase
        .from("student_accounts")
        .update({
          total_paid: newTotalPaid,
          balance: newBalance,
        })
        .eq("id", account.id);
    }

    return payment as Payment;
  }

  /**
   * Fetch invoice list with filters
   */
  async findInvoices(filters: InvoiceFilters): Promise<PaginatedResult<Invoice>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from("invoices")
      .select(
        `
        *,
        student:profiles!student_id(id, full_name, student_code)
      `,
        { count: "exact" }
      );

    if (filters.academicYearId) {
      query = query.eq("academic_year_id", filters.academicYearId);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.month) {
      // Match issue_date starting with YYYY-MM
      query = query.like("issue_date", `${filters.month}%`);
    }

    // Filter by student search (full_name or student_code)
    if (filters.search) {
      query = query.or(
        `student.full_name.ilike.%${filters.search}%,student.student_code.ilike.%${filters.search}%`
      );
    }

    // Filter by class_id (requires subquery through enrollments)
    if (filters.classId) {
      // Get student_ids enrolled in this class
      const { data: enrollments } = await this.supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", filters.classId)
        .eq("status", "enrolled");

      const studentIds = (enrollments || []).map((e) => e.student_id);
      
      if (studentIds.length > 0) {
        query = query.in("student_id", studentIds);
      } else {
        // Return empty result if class has no students
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return {
      data: (data || []) as Invoice[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Get finance dashboard statistics
   */
  async getOverviewStats(academicYearId: string): Promise<FinanceOverview> {
    // 1. Aggregate invoice statistics
    const { data: invoices, error: invoiceError } = await this.supabase
      .from("invoices")
      .select("total_amount, paid_amount, status")
      .eq("academic_year_id", academicYearId);

    if (invoiceError) {
      throw new Error(`Failed to calculate overview: ${invoiceError.message}`);
    }

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let overdueInvoicesCount = 0;
    const totalInvoicesCount = invoices?.length || 0;

    invoices?.forEach((inv) => {
      if (inv.status !== "cancelled") {
        totalInvoiced += Number(inv.total_amount);
        totalPaid += Number(inv.paid_amount);
        totalDebt += Number(inv.total_amount) - Number(inv.paid_amount);

        if (inv.status === "paid") {
          paidInvoicesCount++;
        } else if (inv.status === "pending" || inv.status === "partial") {
          pendingInvoicesCount++;
        } else if (inv.status === "overdue") {
          overdueInvoicesCount++;
        }
      }
    });

    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalDebt,
      paymentRate: Math.round(paymentRate * 100) / 100,
      totalInvoicesCount,
      paidInvoicesCount,
      pendingInvoicesCount,
      overdueInvoicesCount,
    };
  }

  /**
   * Fetch payment methods lookup list
   */
  async getPaymentMethods(): Promise<Array<{ id: string; name: string; type: string }>> {
    const { data, error } = await this.supabase
      .from("payment_methods")
      .select("id, name, type")
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    return data || [];
  }
}
