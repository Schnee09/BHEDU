/**
 * Calendar Events API
 * GET /api/calendar - Fetch calendar events
 * POST /api/calendar - Create a new calendar event
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()

    // RLS policies now allow public SELECT
    const supabase = createClientFromRequest(req)

    // Calculate date range for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

    console.log('[Calendar API] Fetching events:', { year, month, startDate, endDate })

    const { data: events, error, count } = await supabase
      .from('calendar_events')
      .select('id, title, description, event_type, start_date, end_date, start_time, end_time, is_all_day, color', { count: 'exact' })
      .gte('start_date', startDate)
      .lt('start_date', endDate)
      .order('start_date')

    console.log('[Calendar API] Result:', { count, error: error?.message })

    if (error) {
      console.error('Calendar fetch error:', error)
      return NextResponse.json({ success: true, events: [] })
    }

    return NextResponse.json({ success: true, events: events || [] })
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ success: true, events: [] })
  }
}

export async function POST(req: NextRequest) {
  console.log('[Calendar API POST] Starting...')
  try {
    const authResult = await adminAuth(req)
    console.log('[Calendar API POST] Auth result:', { authorized: authResult.authorized, userId: authResult.userId })
    
    if (!authResult.authorized) {
      console.log('[Calendar API POST] Unauthorized, returning 401')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('[Calendar API POST] Request body:', body)
    
    const { title, event_type, start_date, end_date, start_time, end_time, is_all_day, color, description } = body

    if (!title || !event_type || !start_date) {
      console.log('[Calendar API POST] Missing required fields')
      return NextResponse.json(
        { success: false, error: 'title, event_type, and start_date are required' },
        { status: 400 }
      )
    }

    // Use service client for admin writes to bypass RLS
    console.log('[Calendar API POST] Creating service client...')
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()
    console.log('[Calendar API POST] Service client created')

    const insertData: Record<string, any> = {
      title,
      event_type,
      start_date,
      end_date: end_date || null,
      start_time: start_time || null,
      end_time: end_time || null,
      is_all_day: is_all_day ?? true,
      color: color || '#6366f1',
      description: description || null,
    }

    // Only add created_by if userId is available
    if (authResult.userId) {
      insertData.created_by = authResult.userId
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/calendar:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
