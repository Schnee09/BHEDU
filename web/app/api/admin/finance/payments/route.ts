/**
 * Payments API
 * Records and manages payments from students
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const supabase = createClientFromRequest(request as any)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const paymentMethodId = searchParams.get('payment_method_id')

    let query = supabase
      .from('payments')
      .select(`
        *,
        student:profiles!payments_student_id_fkey(
          id,
          student_id,
          full_name,
          email,
          grade_level
        ),
        payment_method:payment_methods(id, name, type),
        received_by_user:profiles!payments_received_by_fkey(
          id,
          full_name
        ),
        allocations:payment_allocations(
          *,
          invoice:invoices(invoice_number, total_amount)
        )
      `)
      .order('payment_date', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (startDate) {
      query = query.gte('payment_date', startDate)
    }

    if (endDate) {
      query = query.lte('payment_date', endDate)
    }

    if (paymentMethodId) {
      query = query.eq('payment_method_id', paymentMethodId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const body = await request.json()
    const {
      student_id,
      student_account_id,
      payment_method_id,
      amount,
      payment_date,
      transaction_reference,
      notes,
      allocations // Array of { invoice_id, amount }
    } = body

    if (!student_id || !payment_method_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Student ID, payment method, and valid amount are required' },
        { status: 400 }
      )
    }

    const supabase = createClientFromRequest(request as any)

    // Generate receipt number
    const timestamp = Date.now()
    const receiptNumber = `RCP-${timestamp}`

    // Verify total allocation matches payment amount
    if (allocations && Array.isArray(allocations)) {
      const totalAllocated = allocations.reduce((sum: number, alloc: { amount: number }) => sum + alloc.amount, 0)
      if (Math.abs(totalAllocated - amount) > 0.01) { // Allow small floating point differences
        return NextResponse.json(
          { error: 'Total allocated amount must equal payment amount' },
          { status: 400 }
        )
      }
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        receipt_number: receiptNumber,
        student_id,
        student_account_id,
        payment_method_id,
        amount,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        transaction_reference,
        notes,
        received_by: authResult.userId
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Create payment allocations if provided
    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      const allocationRecords = allocations.map((alloc: {
        invoice_id: string
        amount: number
      }) => ({
        payment_id: payment.id,
        invoice_id: alloc.invoice_id,
        amount: alloc.amount
      }))

      const { error: allocError } = await supabase
        .from('payment_allocations')
        .insert(allocationRecords)

      if (allocError) {
        console.error('Error creating payment allocations:', allocError)
        // Rollback: delete the payment
        await supabase.from('payments').delete().eq('id', payment.id)
        return NextResponse.json({ error: 'Failed to allocate payment' }, { status: 500 })
      }
    }

    // Fetch complete payment with all details
    const { data: completePayment } = await supabase
      .from('payments')
      .select(`
        *,
        student:profiles!payments_student_id_fkey(
          id,
          student_id,
          full_name,
          email,
          grade_level
        ),
        payment_method:payment_methods(id, name, type),
        received_by_user:profiles!payments_received_by_fkey(
          id,
          full_name
        ),
        allocations:payment_allocations(
          *,
          invoice:invoices(invoice_number, total_amount)
        )
      `)
      .eq('id', payment.id)
      .single()

    return NextResponse.json({ success: true, data: completePayment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
