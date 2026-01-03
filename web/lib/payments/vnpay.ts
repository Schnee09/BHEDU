/**
 * VNPay Payment Gateway Integration
 * 
 * Implements VNPay payment gateway for tuition fee payments.
 * Reference: https://sandbox.vnpayment.vn/apis/
 * 
 * Environment variables required:
 * - VNPAY_TMN_CODE: Terminal ID (Merchant Code)
 * - VNPAY_HASH_SECRET: Secret key for signing
 * - VNPAY_URL: VNPay payment URL
 * - VNPAY_RETURN_URL: Callback URL after payment
 */

import crypto from 'crypto';

// VNPay configuration
export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  vnpUrl: string;
  returnUrl: string;
}

// Payment request data
export interface PaymentRequest {
  orderId: string;
  amount: number; // In VND
  orderInfo: string;
  orderType?: string;
  locale?: 'vn' | 'en';
  bankCode?: string;
  ipAddress: string;
}

// Payment result
export interface PaymentResult {
  success: boolean;
  orderId: string;
  amount: number;
  transactionNo?: string;
  bankCode?: string;
  payDate?: string;
  responseCode: string;
  message: string;
}

// VNPay response codes
export const VNPAY_RESPONSE_CODES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
  '09': 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
  '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch',
  '12': 'Thẻ/Tài khoản của khách hàng bị khóa',
  '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
  '65': 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Quý khách nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

// List of supported banks
export const VNPAY_BANKS = [
  { code: '', name: 'Không chọn (hiển thị tất cả)' },
  { code: 'VNPAYQR', name: 'VNPay QR' },
  { code: 'VNBANK', name: 'Thẻ ATM/Tài khoản ngân hàng nội địa' },
  { code: 'INTCARD', name: 'Thẻ quốc tế' },
  { code: 'NCB', name: 'NCB' },
  { code: 'SACOMBANK', name: 'Sacombank' },
  { code: 'EXIMBANK', name: 'Eximbank' },
  { code: 'MSBANK', name: 'MSB' },
  { code: 'NAMABANK', name: 'NamABank' },
  { code: 'VNMART', name: 'VnMart' },
  { code: 'VIETINBANK', name: 'Vietinbank' },
  { code: 'VIETCOMBANK', name: 'Vietcombank' },
  { code: 'HDBANK', name: 'HDBank' },
  { code: 'DONGABANK', name: 'Dong A Bank' },
  { code: 'TPBANK', name: 'TPBank' },
  { code: 'OJB', name: 'OceanBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'TECHCOMBANK', name: 'Techcombank' },
  { code: 'VPBANK', name: 'VPBank' },
  { code: 'AGRIBANK', name: 'Agribank' },
  { code: 'MBBANK', name: 'MBBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'IVB', name: 'IVB' },
];

/**
 * Get VNPay configuration from environment variables
 */
export function getVNPayConfig(): VNPayConfig {
  return {
    tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'DEMOSECRETKEY',
    vnpUrl: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/callback',
  };
}

/**
 * Sort object properties alphabetically
 */
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

/**
 * Create VNPay payment URL
 */
export function createPaymentUrl(request: PaymentRequest, config?: VNPayConfig): string {
  const cfg = config || getVNPayConfig();
  
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

  let vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: cfg.tmnCode,
    vnp_Locale: request.locale || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: request.orderId,
    vnp_OrderInfo: request.orderInfo,
    vnp_OrderType: request.orderType || 'other',
    vnp_Amount: String(request.amount * 100), // VNPay uses VND * 100
    vnp_ReturnUrl: cfg.returnUrl,
    vnp_IpAddr: request.ipAddress,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  if (request.bankCode) {
    vnpParams['vnp_BankCode'] = request.bankCode;
  }

  vnpParams = sortObject(vnpParams);

  const signData = new URLSearchParams(vnpParams).toString();
  const hmac = crypto.createHmac('sha512', cfg.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  vnpParams['vnp_SecureHash'] = signed;

  const paymentUrl = `${cfg.vnpUrl}?${new URLSearchParams(vnpParams).toString()}`;
  
  return paymentUrl;
}

/**
 * Verify VNPay callback signature
 */
export function verifyCallback(query: Record<string, string>, config?: VNPayConfig): boolean {
  const cfg = config || getVNPayConfig();
  
  const secureHash = query['vnp_SecureHash'];
  if (!secureHash) return false;

  // Remove hash fields for verification
  const verifyData: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      verifyData[key] = value;
    }
  }

  const sortedData = sortObject(verifyData);
  const signData = new URLSearchParams(sortedData).toString();
  const hmac = crypto.createHmac('sha512', cfg.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
}

/**
 * Parse VNPay callback response
 */
export function parseCallbackResponse(query: Record<string, string>): PaymentResult {
  const responseCode = query['vnp_ResponseCode'] || '99';
  const success = responseCode === '00';
  
  return {
    success,
    orderId: query['vnp_TxnRef'] || '',
    amount: parseInt(query['vnp_Amount'] || '0', 10) / 100, // Convert back from VNPay format
    transactionNo: query['vnp_TransactionNo'],
    bankCode: query['vnp_BankCode'],
    payDate: query['vnp_PayDate'],
    responseCode,
    message: VNPAY_RESPONSE_CODES[responseCode] || 'Lỗi không xác định',
  };
}

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate unique order ID
 */
export function generateOrderId(prefix: string = 'PAY'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
