/**
 * Timetable API
 * GET /api/timetable - Fetch timetable slots for a class
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

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

    const supabase = createClientFromRequest(req)

    const { data: slots, error } = await supabase
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
      `)
      .eq('class_id', classId)
      .order('day_of_week')
      .order('start_time')

    if (error) {
      console.error('Timetable fetch error:', error)
      // Return empty array instead of error for better UX
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
