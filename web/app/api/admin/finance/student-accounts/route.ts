/**
 * Student Accounts API
 * Manages student financial accounts and balances
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
    const academicYearId = searchParams.get('academic_year_id')
    const status = searchParams.get('status')
    const hasBalance = searchParams.get('has_balance')

    let query = supabase
      .from('student_accounts')
      .select(`
        *,
        student:profiles!student_accounts_student_id_fkey(
          id,
          student_id,
          full_name,
          email,
          grade_level
        ),
        academic_year:academic_years(id, name)
      `)
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (hasBalance === 'true') {
      query = query.gt('balance', 0)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching student accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch student accounts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/student-accounts:', error)
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
    const { student_id, academic_year_id } = body

    if (!student_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'Student ID and academic year ID are required' },
        { status: 400 }
      )
    }

    const supabase = createClientFromRequest(request as any)

    // Check if account already exists
    const { data: existing } = await supabase
      .from('student_accounts')
      .select('id')
      .eq('student_id', student_id)
      .eq('academic_year_id', academic_year_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Student account already exists for this academic year' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('student_accounts')
      .insert({
        student_id,
        academic_year_id,
        total_fees: 0,
        total_paid: 0,
        status: 'pending'
      })
      .select(`
        *,
        student:profiles!student_accounts_student_id_fkey(
          id,
          student_id,
          full_name,
          email,
          grade_level
        ),
        academic_year:academic_years(id, name)
      `)
      .single()

    if (error) {
      console.error('Error creating student account:', error)
      return NextResponse.json({ error: 'Failed to create student account' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/student-accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
