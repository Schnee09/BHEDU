/**
 * Payment Service - Business logic for payments, invoices, and transaction processing
 *
 * MIGRATED TO INSTANCE-BASED (Architecture v5.0)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { createPaymentSchema } from "@/lib/schemas";
import {
  createPaymentUrl,
  formatCurrency,
  generateOrderId,
  parseCallbackResponse,
  type PaymentRequest,
  type PaymentResult,
  verifyCallback,
} from "./vnpay";
import { logger } from "@/lib/logger";

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  paymentMethod: "vnpay" | "cash" | "bank_transfer";
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  amount: number;
  description: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  createdAt: string;
}

export interface CreatePaymentParams {
  invoiceId: string;
  studentId: string;
  amount: number;
  description: string;
  ipAddress: string;
  bankCode?: string;
}

export class PaymentService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Create a new payment and get VNPay URL
   */
  async createPayment(params: CreatePaymentParams): Promise<{
    paymentId: string;
    orderId: string;
    paymentUrl: string;
  }> {
    // Validate input
    const validated = createPaymentSchema.safeParse(params);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0].message);
    }

    // Generate order ID
    const orderId = generateOrderId("EDU");

    logger.info(
      `[PaymentService] Starting transaction for Invoice: ${params.invoiceId}, Amount: ${params.amount}`,
    );

    // Create payment record
    const { data: payment, error } = await this.supabase
      .from("payment_transactions")
      .insert({
        invoice_id: params.invoiceId,
        student_id: params.studentId,
        amount: params.amount,
        payment_method: "vnpay",
        status: "pending",
        transaction_id: orderId,
      })
      .select("id")
      .single();

    if (error) {
      logger.error(`[PaymentService] Failed to create payment record:`, error);
      throw new Error("Không thể tạo giao dịch thanh toán trên hệ thống");
    }

    // Create VNPay URL
    const paymentRequest: PaymentRequest = {
      orderId,
      amount: params.amount,
      orderInfo: params.description,
      ipAddress: params.ipAddress,
      locale: "vn",
      bankCode: params.bankCode,
    };

    const paymentUrl = createPaymentUrl(paymentRequest);

    // Update payment with processing status
    await this.supabase
      .from("payment_transactions")
      .update({ status: "processing" })
      .eq("id", payment.id);

    return {
      paymentId: payment.id,
      orderId,
      paymentUrl,
    };
  }

  /**
   * Process payment callback from VNPay
   */
  async processPaymentCallback(
    query: Record<string, string>,
  ): Promise<PaymentResult & { paymentId?: string }> {
    // Verify signature
    const isValid = verifyCallback(query);
    if (!isValid) {
      return {
        success: false,
        orderId: query["vnp_TxnRef"] || "",
        amount: 0,
        responseCode: "97",
        message: "Chữ ký không hợp lệ",
      };
    }

    // Parse response
    const result = parseCallbackResponse(query);

    // Find and update payment
    const { data: payment } = await this.supabase
      .from("payment_transactions")
      .select("id, invoice_id")
      .eq("transaction_id", result.orderId)
      .single();

    if (payment) {
      const newStatus = result.success ? "completed" : "failed";

      // Update payment status
      await this.supabase
        .from("payment_transactions")
        .update({
          status: newStatus,
          gateway_response: query,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // If successful, update invoice status
      if (result.success && payment.invoice_id) {
        await this.supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", payment.invoice_id);
      }

      return { ...result, paymentId: payment.id };
    }

    return result;
  }

  /**
   * Get payment history for a student
   */
  async getStudentPayments(studentId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from("payment_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch payments:", error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      studentId: p.student_id,
      amount: p.amount,
      status: p.status,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      gatewayResponse: p.gateway_response,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  /**
   * Get unpaid invoices for a student
   */
  async getUnpaidInvoices(studentId: string): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select(`
        id,
        student_id,
        amount,
        description,
        due_date,
        status,
        created_at,
        student:student_id(full_name, student_id)
      `)
      .eq("student_id", studentId)
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true });

    if (error) {
      logger.error("Failed to fetch invoices:", error);
      return [];
    }

    return (data || []).map((inv) => ({
      id: inv.id,
      studentId: inv.student_id,
      studentName: (inv.student as any)?.full_name,
      studentCode: (inv.student as any)?.student_id,
      amount: inv.amount,
      description: inv.description,
      dueDate: inv.due_date,
      status: inv.status,
      createdAt: inv.created_at,
    }));
  }

  /**
   * Generate payment receipt
   */
  static generateReceipt(payment: Payment, invoice: Invoice): string {
    return `
      BIÊN LAI THANH TOÁN
      ===================
      
      Mã giao dịch: ${payment.transactionId}
      Ngày thanh toán: ${new Date(payment.updatedAt).toLocaleString("vi-VN")}
      
      Thông tin học sinh:
      - Họ tên: ${invoice.studentName}
      - Mã học sinh: ${invoice.studentCode}
      
      Chi tiết:
      - Nội dung: ${invoice.description}
      - Số tiền: ${formatCurrency(payment.amount)}
      
      Phương thức: ${
      payment.paymentMethod === "vnpay"
        ? "Thanh toán trực tuyến (VNPay)"
        : payment.paymentMethod === "cash"
        ? "Tiền mặt"
        : "Chuyển khoản"
    }
      
      Trạng thái: ${
      payment.status === "completed" ? "Đã thanh toán" : "Chưa thanh toán"
    }
      
      ===================
      Cảm ơn quý phụ huynh!
    `.trim();
  }

  // ============================================================
  // STATIC DELEGATES FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async createPayment(params: CreatePaymentParams) {
    return paymentService.createPayment(params);
  }

  static async processPaymentCallback(query: Record<string, string>) {
    return paymentService.processPaymentCallback(query);
  }

  static async getStudentPayments(studentId: string) {
    return paymentService.getStudentPayments(studentId);
  }

  static async getUnpaidInvoices(studentId: string) {
    return paymentService.getUnpaidInvoices(studentId);
  }
}

// Default singleton instance
export const paymentService = new PaymentService();

// Export individual functions for easier transition
export const createPayment = PaymentService.createPayment;
export const processPaymentCallback = PaymentService.processPaymentCallback;
export const getStudentPayments = PaymentService.getStudentPayments;
export const getUnpaidInvoices = PaymentService.getUnpaidInvoices;
export const generateReceipt = PaymentService.generateReceipt;
