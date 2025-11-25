/**
 * Invoices API
 * Manages student invoices for fees
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
    const status = searchParams.get('status')
    const academicYearId = searchParams.get('academic_year_id')

    let query = supabase
      .from('invoices')
      .select(`
        *,
        student:profiles!invoices_student_id_fkey(
          id,
          full_name,
          email
        ),
        academic_year:academic_years(id, name),
        items:invoice_items(
          *,
          fee_type:fee_types(id, name, category)
        )
      `)
      .order('issue_date', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/invoices:', error)
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
      academic_year_id, 
      due_date, 
      items, 
      notes 
    } = body

    if (!student_id || !due_date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Student ID, due date, and at least one item are required' },
        { status: 400 }
      )
    }

    const supabase = createClientFromRequest(request as any)

    // Generate invoice number
    const timestamp = Date.now()
    const invoiceNumber = `INV-${timestamp}`

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: {
      quantity: number
      unit_price: number
      discount_percentage: number
    }) => {
      const itemTotal = item.quantity * item.unit_price
      const discount = itemTotal * (item.discount_percentage || 0) / 100
      return sum + (itemTotal - discount)
    }, 0)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        student_id,
        student_account_id,
        academic_year_id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date,
        total_amount: totalAmount,
        paid_amount: 0,
        status: 'unpaid',
        notes,
        created_by: authResult.userId
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    const invoiceItems = items.map((item: {
      fee_type_id?: string
      description: string
      quantity: number
      unit_price: number
      discount_percentage?: number
    }) => {
      const itemTotal = item.quantity * item.unit_price
      const discount = itemTotal * (item.discount_percentage || 0) / 100
      return {
        invoice_id: invoice.id,
        fee_type_id: item.fee_type_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        amount: itemTotal - discount
      }
    })

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError)
      // Rollback: delete the invoice
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        student:profiles!invoices_student_id_fkey(
          id,
          full_name,
          email
        ),
        academic_year:academic_years(id, name),
        items:invoice_items(
          *,
          fee_type:fee_types(id, name, category)
        )
      `)
      .eq('id', invoice.id)
      .single()

    return NextResponse.json({ success: true, data: completeInvoice }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
