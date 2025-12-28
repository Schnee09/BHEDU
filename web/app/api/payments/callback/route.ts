/**
 * Payment Callback API Endpoint
 * 
 * Handles VNPay payment callback after transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPaymentCallback } from '@/lib/payments/paymentService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: Record<string, string> = {};
    
    // Convert searchParams to object
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    // Process the callback
    const result = await processPaymentCallback(query);

    // Redirect to payment result page
    const redirectUrl = new URL('/dashboard/finance/payments/result', request.url);
    redirectUrl.searchParams.set('success', result.success ? 'true' : 'false');
    redirectUrl.searchParams.set('orderId', result.orderId);
    redirectUrl.searchParams.set('amount', String(result.amount));
    redirectUrl.searchParams.set('message', result.message);
    
    if (result.transactionNo) {
      redirectUrl.searchParams.set('transactionNo', result.transactionNo);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Payment callback error:', error);
    
    // Redirect to error page
    const errorUrl = new URL('/dashboard/finance/payments/result', request.url);
    errorUrl.searchParams.set('success', 'false');
    errorUrl.searchParams.set('message', 'Có lỗi xảy ra khi xử lý thanh toán');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}

// VNPay also sends IPN (Instant Payment Notification) via POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const query: Record<string, string> = {};
    
    params.forEach((value, key) => {
      query[key] = value;
    });

    const result = await processPaymentCallback(query);

    // Return IPN response
    if (result.success) {
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      return NextResponse.json({ RspCode: '01', Message: result.message });
    }
  } catch (error) {
    console.error('Payment IPN error:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
  }
}
