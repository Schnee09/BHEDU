/**
 * Timetable API
 * GET /api/timetable - Fetch timetable slots for a class
 * POST /api/timetable - Create a new timetable slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json({ 
        success: true, 
        slots: [] 
      })
    }

    // RLS policies now allow public SELECT
    const supabase = createClientFromRequest(req)

    console.log('[Timetable API] Fetching slots for class:', classId)

    const { data: slots, error, count } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        class_id,
        day_of_week,
        start_time,
        end_time,
        room,
        notes,
        subjects (id, name, code),
        profiles!timetable_slots_teacher_id_fkey (id, full_name)
      `, { count: 'exact' })
      .eq('class_id', classId)
      .order('day_of_week')
      .order('start_time')

    console.log('[Timetable API] Result:', { count, error: error?.message })

    if (error) {
      console.error('Timetable fetch error:', error)
      return NextResponse.json({ success: true, slots: [] })
    }

    // Transform data to match expected format
    const transformedSlots = (slots || []).map((slot: any) => ({
      id: slot.id,
      class_id: slot.class_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room: slot.room,
      notes: slot.notes,
      subject: slot.subjects,
      teacher: slot.profiles
    }))

    return NextResponse.json({ success: true, slots: transformedSlots })
  } catch (error: any) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json({ success: true, slots: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, notes } = body

    if (!class_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'class_id, day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // Use service client for admin writes to bypass RLS
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    const { data: slot, error } = await supabase
      .from('timetable_slots')
      .insert({
        class_id,
        subject_id: subject_id || null,
        teacher_id: teacher_id || null,
        day_of_week,
        start_time,
        end_time,
        room: room || null,
        notes: notes || null
      })
      .select(`
        id,
        class_id,
        day_of_week,
        start_time,
        end_time,
        room,
        notes,
        subjects (id, name, code),
        profiles!timetable_slots_teacher_id_fkey (id, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating timetable slot:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform to match expected format
    const transformedSlot = {
      ...slot,
      subject: (slot as any).subjects,
      teacher: (slot as any).profiles
    }

    return NextResponse.json({ success: true, slot: transformedSlot }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/timetable:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

