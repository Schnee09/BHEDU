/**
 * Individual Fee Type API
 * GET/PUT/DELETE operations for specific fee types
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { id } = await ctx.params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('fee_types')
      .select('*, academic_year:academic_years(id, name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Fee type not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/fee-types/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { id } = await ctx.params
    const body = await request.json()
    const { name, description, amount, category, is_mandatory, is_active, academic_year_id } = body

    const supabase = createServiceClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (amount !== undefined) updates.amount = amount
    if (category !== undefined) updates.category = category
    if (is_mandatory !== undefined) updates.is_mandatory = is_mandatory
    if (is_active !== undefined) updates.is_active = is_active
    if (academic_year_id !== undefined) updates.academic_year_id = academic_year_id

    const { data, error } = await supabase
      .from('fee_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating fee type:', error)
      return NextResponse.json({ error: 'Failed to update fee type' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/finance/fee-types/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, ctx: Params) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { id } = await ctx.params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('fee_types')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting fee type:', error)
      return NextResponse.json({ error: 'Failed to delete fee type' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/finance/fee-types/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
