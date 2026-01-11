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
        profiles!timetable_slots_teacher_id_fkey (id, full_name),
        classes (id, name)
      `)
      .order('room')
      .order('day_of_week')
      .order('start_time')

    if (error) {
      logger.warn('Timetable all fetch error', { error: error.message })
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
      teacher: slot.profiles,
      class: slot.classes
    }))

    return NextResponse.json({ success: true, slots: transformedSlots })
  } catch (error) {
    logger.error('Error fetching all timetable slots', error)
    return NextResponse.json({ success: true, slots: [] })
  }
}
