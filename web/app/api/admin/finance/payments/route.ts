/**
 * Payments API
 * Records and manages payments from students
 * Updated: 2025-12-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createClientFromRequest } from '@/lib/supabase/server'
import { handleApiError, ValidationError } from '@/lib/api/errors'
import { createPaymentSchema } from '@/lib/schemas/finance'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const supabase = createClientFromRequest(request as any)
    
    // Check if payments table exists
    const { error: tableCheckError } = await supabase
      .from('payments')
      .select('id')
      .limit(1)
    
    if (tableCheckError) {
      logger.warn('Payments table not configured:', { error: tableCheckError.message })
      return NextResponse.json({ 
        success: true, 
        data: [],
        note: 'Payments table not yet configured'
      })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const paymentMethodId = searchParams.get('payment_method_id')

    // Try fetching with embedded joins first
    let query = supabase
      .from('payments')
      .select(`
        *,
        student:profiles!payments_student_id_fkey(
          id,
          full_name,
          email
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

    // eslint-disable-next-line prefer-const
    let { data, error: _error } = await query

    // Fallback: fetch without embedded joins and batch fetch related data
    if (_error) {
      console.warn('Embedded join failed, using fallback:', _error.message)
      
      let fallbackQuery = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })

      if (studentId) fallbackQuery = fallbackQuery.eq('student_id', studentId)
      if (startDate) fallbackQuery = fallbackQuery.gte('payment_date', startDate)
      if (endDate) fallbackQuery = fallbackQuery.lte('payment_date', endDate)
      if (paymentMethodId) fallbackQuery = fallbackQuery.eq('payment_method_id', paymentMethodId)

      const { data: payments, error: paymentsError } = await fallbackQuery

      if (paymentsError || !payments) {
        console.error('Error fetching payments:', paymentsError)
        return NextResponse.json({ error: 'Failed to fetch payments', details: paymentsError?.message }, { status: 500 })
      }

      // Batch fetch related data
      const studentIds = [...new Set(payments.map(p => p.student_id).filter(Boolean))]
      const receivedByIds = [...new Set(payments.map(p => p.received_by).filter(Boolean))]
      const paymentMethodIds = [...new Set(payments.map(p => p.payment_method_id).filter(Boolean))]
      const paymentIds = payments.map(p => p.id)

      const [studentsData, receivedByData, methodsData, allocationsData] = await Promise.all([
        studentIds.length > 0 ? supabase.from('profiles').select('id, full_name, email').in('id', studentIds as string[]) : { data: [] },
        receivedByIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', receivedByIds as string[]) : { data: [] },
        paymentMethodIds.length > 0 ? supabase.from('payment_methods').select('id, name, type').in('id', paymentMethodIds as string[]) : { data: [] },
        paymentIds.length > 0 ? supabase.from('payment_allocations').select('*').in('payment_id', paymentIds) : { data: [] }
      ])

      // Build lookup maps
      const studentsMap: Record<string, any> = {}
      studentsData.data?.forEach(s => { studentsMap[s.id] = s })

      const receivedByMap: Record<string, any> = {}
      receivedByData.data?.forEach(r => { receivedByMap[r.id] = r })

      const methodsMap: Record<string, any> = {}
      methodsData.data?.forEach(m => { methodsMap[m.id] = m })

      // Get invoice IDs from allocations
      const invoiceIds = [...new Set((allocationsData.data || []).map((a: any) => a.invoice_id).filter(Boolean))]
      const { data: invoicesData } = invoiceIds.length > 0 
        ? await supabase.from('invoices').select('id, invoice_number, total_amount').in('id', invoiceIds as string[])
        : { data: [] }

      const invoicesMap: Record<string, any> = {}
      invoicesData?.forEach(i => { invoicesMap[i.id] = i })

      // Enrich allocations with invoice data
      const enrichedAllocations = (allocationsData.data || []).map((alloc: any) => ({
        ...alloc,
        invoice: invoicesMap[alloc.invoice_id] || null
      }))

      // Group allocations by payment_id
      const allocationsByPayment: Record<string, any[]> = {}
      enrichedAllocations.forEach((alloc: any) => {
        if (!allocationsByPayment[alloc.payment_id]) {
          allocationsByPayment[alloc.payment_id] = []
        }
        allocationsByPayment[alloc.payment_id].push(alloc)
      })

      // Enrich payments with related data
      data = payments.map(payment => ({
        ...payment,
        student: studentsMap[payment.student_id] || null,
        payment_method: methodsMap[payment.payment_method_id] || null,
        received_by_user: receivedByMap[payment.received_by] || null,
        allocations: allocationsByPayment[payment.id] || []
      }))
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body with schema
    const validatedData = createPaymentSchema.parse(body)

    const supabase = createClientFromRequest(request as any)

    // Generate receipt number
    const timestamp = Date.now()
    const receiptNumber = `RCP-${timestamp}`

    // Verify total allocation matches payment amount if allocations provided
    if (validatedData.allocations && validatedData.allocations.length > 0) {
      const totalAllocated = validatedData.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
      if (Math.abs(totalAllocated - validatedData.amount) > 0.01) { // Allow small floating point differences
        throw new ValidationError('Total allocated amount must equal payment amount')
      }
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        receipt_number: receiptNumber,
        student_id: validatedData.student_id,
        student_account_id: validatedData.student_account_id || null,
        payment_method_id: validatedData.payment_method_id,
        amount: validatedData.amount,
        payment_date: validatedData.payment_date || new Date().toISOString().split('T')[0],
        transaction_reference: validatedData.transaction_reference || null,
        notes: validatedData.notes || null,
        received_by: authResult.userId
      })
      .select()
      .single()

    if (paymentError) {
      logger.error('Error creating payment:', paymentError)
      throw new Error(`Failed to create payment: ${paymentError.message}`)
    }

    // Create payment allocations if provided
    if (validatedData.allocations && validatedData.allocations.length > 0) {
      const allocationRecords = validatedData.allocations.map(alloc => ({
        payment_id: payment.id,
        invoice_id: alloc.invoice_id,
        amount: alloc.amount
      }))

      const { error: allocError } = await supabase
        .from('payment_allocations')
        .insert(allocationRecords)

      if (allocError) {
        logger.error('Error creating payment allocations:', allocError)
        // Rollback: delete the payment
        await supabase.from('payments').delete().eq('id', payment.id)
        throw new Error(`Failed to allocate payment: ${allocError.message}`)
      }
    }

    // Fetch complete payment with all details
    // eslint-disable-next-line prefer-const
    let { data: completePayment, error: _fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        student:profiles!payments_student_id_fkey(
          id,
          full_name,
          email
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

    // Fallback if embedded joins fail
    if (_fetchError) {
      const { data: paymentOnly } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment.id)
        .single()

      if (paymentOnly) {
        const [studentData, methodData, receivedByData, allocationsData] = await Promise.all([
          paymentOnly.student_id ? supabase.from('profiles').select('id, full_name, email').eq('id', paymentOnly.student_id).single() : { data: null },
          paymentOnly.payment_method_id ? supabase.from('payment_methods').select('id, name, type').eq('id', paymentOnly.payment_method_id).single() : { data: null },
          paymentOnly.received_by ? supabase.from('profiles').select('id, full_name').eq('id', paymentOnly.received_by).single() : { data: null },
          supabase.from('payment_allocations').select('*').eq('payment_id', paymentOnly.id)
        ])

        // Get invoice details for allocations
        const invoiceIds = (allocationsData.data || []).map((a: any) => a.invoice_id).filter(Boolean)
        const { data: invoicesData } = invoiceIds.length > 0
          ? await supabase.from('invoices').select('id, invoice_number, total_amount').in('id', invoiceIds)
          : { data: [] }

        const invoicesMap: Record<string, any> = {}
        invoicesData?.forEach(i => { invoicesMap[i.id] = i })

        const enrichedAllocations = (allocationsData.data || []).map((alloc: any) => ({
          ...alloc,
          invoice: invoicesMap[alloc.invoice_id] || null
        }))

        completePayment = {
          ...paymentOnly,
          student: studentData.data,
          payment_method: methodData.data,
          received_by_user: receivedByData.data,
          allocations: enrichedAllocations
        }
      }
    }

    return NextResponse.json({ success: true, data: completePayment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
