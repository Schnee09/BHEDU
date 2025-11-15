/**
 * Fee Types Management API
 * Manages different types of fees (tuition, registration, books, etc.)
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        reason: authResult.reason 
      }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academic_year_id')
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('fee_types')
      .select('*, academic_year:academic_years(id, name)')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fee types:', error)
      return NextResponse.json({ error: 'Failed to fetch fee types' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/fee-types:', error)
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
    const { name, description, amount, category, is_mandatory, is_active, academic_year_id } = body

    if (!name || amount === undefined || amount < 0) {
      return NextResponse.json(
        { error: 'Name and valid amount are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('fee_types')
      .insert({
        name,
        description,
        amount,
        category,
        is_mandatory: is_mandatory !== undefined ? is_mandatory : true,
        is_active: is_active !== undefined ? is_active : true,
        academic_year_id,
        created_by: authResult.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fee type:', error)
      return NextResponse.json({ error: 'Failed to create fee type' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/fee-types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
