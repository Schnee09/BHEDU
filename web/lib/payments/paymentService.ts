/**
 * Payment Service
 * 
 * Handles payment processing, status tracking, and receipt generation.
 */

import { createClient } from '@/lib/supabase/server';
import {
  createPaymentUrl,
  generateOrderId,
  formatCurrency,
  parseCallbackResponse,
  verifyCallback,
  type PaymentRequest,
  type PaymentResult,
} from './vnpay';

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'vnpay' | 'cash' | 'bank_transfer';
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
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
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

/**
 * Create a new payment and get VNPay URL
 */
export async function createPayment(params: CreatePaymentParams): Promise<{
  paymentId: string;
  orderId: string;
  paymentUrl: string;
}> {
  const supabase = await createClient();
  
  // Generate order ID
  const orderId = generateOrderId('EDU');
  
  // Create payment record
  const { data: payment, error } = await supabase
    .from('payment_transactions')
    .insert({
      invoice_id: params.invoiceId,
      student_id: params.studentId,
      amount: params.amount,
      payment_method: 'vnpay',
      status: 'pending',
      transaction_id: orderId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create payment record:', error);
    throw new Error('Không thể tạo giao dịch thanh toán');
  }

  // Create VNPay URL
  const paymentRequest: PaymentRequest = {
    orderId,
    amount: params.amount,
    orderInfo: params.description,
    ipAddress: params.ipAddress,
    locale: 'vn',
    bankCode: params.bankCode,
  };

  const paymentUrl = createPaymentUrl(paymentRequest);

  // Update payment with processing status
  await supabase
    .from('payment_transactions')
    .update({ status: 'processing' })
    .eq('id', payment.id);

  return {
    paymentId: payment.id,
    orderId,
    paymentUrl,
  };
}

/**
 * Process payment callback from VNPay
 */
export async function processPaymentCallback(
  query: Record<string, string>
): Promise<PaymentResult & { paymentId?: string }> {
  const supabase = await createClient();
  
  // Verify signature
  const isValid = verifyCallback(query);
  if (!isValid) {
    return {
      success: false,
      orderId: query['vnp_TxnRef'] || '',
      amount: 0,
      responseCode: '97',
      message: 'Chữ ký không hợp lệ',
    };
  }

  // Parse response
  const result = parseCallbackResponse(query);
  
  // Find and update payment
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('id, invoice_id')
    .eq('transaction_id', result.orderId)
    .single();

  if (payment) {
    const newStatus = result.success ? 'completed' : 'failed';
    
    // Update payment status
    await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        gateway_response: query,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // If successful, update invoice status
    if (result.success && payment.invoice_id) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', payment.invoice_id);
    }

    return { ...result, paymentId: payment.id };
  }

  return result;
}

/**
 * Get payment history for a student
 */
export async function getStudentPayments(studentId: string): Promise<Payment[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch payments:', error);
    return [];
  }

  return data.map(p => ({
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
export async function getUnpaidInvoices(studentId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('invoices')
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
    .eq('student_id', studentId)
    .in('status', ['pending', 'overdue'])
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch invoices:', error);
    return [];
  }

  return data.map(inv => ({
    id: inv.id,
    studentId: inv.student_id,
    studentName: inv.student?.full_name,
    studentCode: inv.student?.student_id,
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
export function generateReceipt(payment: Payment, invoice: Invoice): string {
  return `
    BIÊN LAI THANH TOÁN
    ===================
    
    Mã giao dịch: ${payment.transactionId}
    Ngày thanh toán: ${new Date(payment.updatedAt).toLocaleString('vi-VN')}
    
    Thông tin học sinh:
    - Họ tên: ${invoice.studentName}
    - Mã học sinh: ${invoice.studentCode}
    
    Chi tiết:
    - Nội dung: ${invoice.description}
    - Số tiền: ${formatCurrency(payment.amount)}
    
    Phương thức: ${payment.paymentMethod === 'vnpay' ? 'Thanh toán trực tuyến (VNPay)' : 
                   payment.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
    
    Trạng thái: ${payment.status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}
    
    ===================
    Cảm ơn quý phụ huynh!
  `.trim();
}
