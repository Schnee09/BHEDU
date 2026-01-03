/**
 * Create Payment API Endpoint
 * 
 * Creates a payment session and returns VNPay redirect URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayment } from '@/lib/payments/paymentService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, description, bankCode } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: 'Invoice ID and amount are required' },
        { status: 400 }
      );
    }

    // Get student ID from invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('student_id, status')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice already paid' },
        { status: 400 }
      );
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    // Create payment
    const result = await createPayment({
      invoiceId,
      studentId: invoice.student_id,
      amount,
      description: description || `Thanh toán hóa đơn ${invoiceId}`,
      ipAddress,
      bankCode,
    });

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      orderId: result.orderId,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
