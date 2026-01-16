/**
 * Timetable All API
 * GET /api/timetable/all - Fetch all timetable slots (for room view)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Require staff/admin auth for viewing all slots
    const authResult = await staffAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    
    // Get week_start_date from query params (optional)
    const { searchParams } = new URL(req.url)
    const weekStartDate = searchParams.get('week_start_date')

    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        class_id,
        student_id,
        day_of_week,
        start_time,
        end_time,
        room,
        notes,
        subjects (id, name, code),
        teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
        student:profiles!timetable_slots_student_id_fkey (id, full_name),
        classes (id, name)
      `)
      .order('room')
      .order('day_of_week')
      .order('start_time')

    if (error) {
      logger.warn('Timetable all fetch error', { error: error.message })
      return NextResponse.json({ success: true, slots: [] })
    }

    // Fetch weekly notes if week_start_date is provided
    let weeklyNotesMap: Record<string, string> = {}
    if (weekStartDate && slots && slots.length > 0) {
      const slotIds = slots.map((slot: any) => slot.id)
      const { data: weeklyNotes } = await supabase
        .from('weekly_notes')
        .select('slot_id, notes')
        .in('slot_id', slotIds)
        .eq('week_start_date', weekStartDate)
      
      if (weeklyNotes) {
        weeklyNotesMap = weeklyNotes.reduce((acc: Record<string, string>, wn: any) => {
          acc[wn.slot_id] = wn.notes
          return acc
        }, {})
      }
    }

    // Transform data to match expected format
    const transformedSlots = (slots || []).map((slot: any) => {
      const weeklyNote = weeklyNotesMap[slot.id]
      return {
        id: slot.id,
        class_id: slot.class_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room,
        notes: slot.notes, // Default notes
        weekly_note: weeklyNote || null, // Week-specific notes
        has_weekly_note: !!weeklyNote,
        subject: slot.subjects,
        teacher: slot.teacher,
        student: slot.student,
        class: slot.classes
      }
    })

    return NextResponse.json({ success: true, slots: transformedSlots })
  } catch (error) {
    logger.error('Error fetching all timetable slots', error)
    return NextResponse.json({ success: true, slots: [] })
  }
}
