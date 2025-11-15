/**
 * Payment Schedules API
 * Manages payment schedules and installments
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academic_year_id')

    let query = supabase
      .from('payment_schedules')
      .select(`
        *,
        academic_year:academic_years(id, name),
        installments:payment_schedule_installments(*)
      `)
      .order('created_at', { ascending: false })

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment schedules:', error)
      return NextResponse.json({ error: 'Failed to fetch payment schedules' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/finance/payment-schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, academic_year_id, schedule_type, installments } = body

    if (!name || !academic_year_id) {
      return NextResponse.json(
        { error: 'Name and academic year are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .insert({
        name,
        description,
        academic_year_id,
        schedule_type: schedule_type || 'installment'
      })
      .select()
      .single()

    if (scheduleError) {
      console.error('Error creating payment schedule:', scheduleError)
      return NextResponse.json({ error: 'Failed to create payment schedule' }, { status: 500 })
    }

    // Create installments if provided
    if (installments && Array.isArray(installments) && installments.length > 0) {
      const installmentRecords = installments.map((inst: {
        installment_number: number
        due_date: string
        percentage: number
        description?: string
      }) => ({
        schedule_id: schedule.id,
        installment_number: inst.installment_number,
        due_date: inst.due_date,
        percentage: inst.percentage,
        description: inst.description
      }))

      const { error: installmentError } = await supabase
        .from('payment_schedule_installments')
        .insert(installmentRecords)

      if (installmentError) {
        console.error('Error creating installments:', installmentError)
        // Schedule created but installments failed - return partial success
        return NextResponse.json({
          success: true,
          data: schedule,
          warning: 'Schedule created but failed to add some installments'
        }, { status: 201 })
      }
    }

    // Fetch complete schedule with installments
    const { data: completeSchedule } = await supabase
      .from('payment_schedules')
      .select(`
        *,
        academic_year:academic_years(id, name),
        installments:payment_schedule_installments(*)
      `)
      .eq('id', schedule.id)
      .single()

    return NextResponse.json({ success: true, data: completeSchedule }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finance/payment-schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
