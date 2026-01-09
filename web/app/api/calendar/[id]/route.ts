/**
 * Calendar Event by ID API
 * PUT /api/calendar/[id] - Update a calendar event
 * DELETE /api/calendar/[id] - Delete a calendar event
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, event_type, start_date, end_date, start_time, end_time, is_all_day, color, description } = body

    const supabase = createClientFromRequest(req)

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        event_type,
        start_date,
        end_date,
        start_time,
        end_time,
        is_all_day,
        color,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    console.error('Error in PUT /api/calendar/[id]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClientFromRequest(req)

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/calendar/[id]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
