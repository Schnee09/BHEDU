/**
 * Payment Methods API
 * Manages available payment methods
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

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/payment-methods:', error)
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
    const { name, type, requires_reference, description, is_active } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const supabase = createClientFromRequest(request as any)

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        name,
        type,
        requires_reference: requires_reference || false,
        description,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment method:', error)
      return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/payment-methods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
