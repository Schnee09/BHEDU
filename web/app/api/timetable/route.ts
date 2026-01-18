/**
 * Timetable API
 * GET /api/timetable - Fetch timetable slots for a class
 * POST /api/timetable - Create a new timetable slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'
import { staffAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('class_id')
    const weekStartDate = searchParams.get('week_start_date')

    if (!classId) {
      return NextResponse.json({ 
        success: true, 
        slots: [] 
      })
    }

    const supabase = createServiceClient()

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
        student:profiles!timetable_slots_student_id_fkey (id, full_name)
      `)
      .eq('class_id', classId)
      .order('day_of_week')
      .order('start_time')

    if (error) {
      logger.warn('Timetable fetch error', { error: error.message })
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
        student: slot.student
      }
    })

    return NextResponse.json({ success: true, slots: transformedSlots })
  } catch (error) {
    logger.error('Error fetching timetable', error)
    return NextResponse.json({ success: true, slots: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await staffAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Staff or Admin required' }, { status: 401 })
    }

    const body = await req.json()
    const { class_id, student_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, notes } = body

    if ((!class_id && !student_id) || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'class_id or student_id, day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single()

    // ========== CONFLICT DETECTION ==========
    // Check for room conflicts (same room, same day, overlapping time)
    if (room && room !== 'Linh hoạt') {
      const { data: roomConflicts } = await supabase
        .from('timetable_slots')
        .select('id, start_time, end_time')
        .eq('room', room)
        .eq('day_of_week', day_of_week)
        .gte('end_time', start_time)
        .lte('start_time', end_time)

      if (roomConflicts && roomConflicts.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Phòng "${room}" đã có lịch vào khung giờ này (${start_time} - ${end_time}). Vui lòng chọn phòng khác hoặc thời gian khác.`
        }, { status: 409 })
      }
    }

    // Check for teacher conflicts (same teacher, same day, overlapping time)
    if (teacher_id) {
      const { data: teacherConflicts } = await supabase
        .from('timetable_slots')
        .select('id, room, start_time, end_time')
        .eq('teacher_id', teacher_id)
        .eq('day_of_week', day_of_week)
        .gte('end_time', start_time)
        .lte('start_time', end_time)

      if (teacherConflicts && teacherConflicts.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Giáo viên đã có lịch dạy vào khung giờ này (${start_time} - ${end_time}) tại "${teacherConflicts[0].room}". Vui lòng chọn thời gian khác.`
        }, { status: 409 })
      }
    }
    // ========== END CONFLICT DETECTION ==========

    const { data: slot, error } = await supabase
      .from('timetable_slots')
      .insert({
        class_id: class_id || null,
        student_id: student_id || null,
        subject_id: subject_id || null,
        teacher_id: teacher_id || null,
        semester_id: activeSemester?.id || null,
        day_of_week,
        start_time,
        end_time,
        room: room || null,
        notes: notes || null
      })
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
        student:profiles!timetable_slots_student_id_fkey (id, full_name)
      `)
      .single()

    if (error) {
      logger.error('Error creating timetable slot', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform to match expected format
    const transformedSlot = {
      ...slot,
      subject: (slot as any).subjects,
      teacher: (slot as any).teacher,
      student: (slot as any).student
    }

    return NextResponse.json({ success: true, slot: transformedSlot }, { status: 201 })
  } catch (error: any) {
    logger.error('Error in POST /api/timetable', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
