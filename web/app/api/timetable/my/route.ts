/**
 * My Timetable API - Role-based schedule view
 * GET /api/timetable/my - Get current user's timetable based on role
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    const serviceClient = createServiceClient()
    let slots: any[] = []
    let classes: any[] = []

    if (profile.role === 'student') {
      // Student: Get classes they're enrolled in
      const { data: enrollments } = await serviceClient
        .from('class_students')
        .select('class_id, classes(id, name)')
        .eq('student_id', profile.id)

      if (enrollments && enrollments.length > 0) {
        const classIds = enrollments.map(e => e.class_id)
        classes = enrollments.map(e => (e as any).classes).filter(Boolean)

        const { data: timetableSlots } = await serviceClient
          .from('timetable_slots')
          .select(`
            id, class_id, day_of_week, start_time, end_time, room, notes,
            subjects (id, name, code),
            profiles!timetable_slots_teacher_id_fkey (id, full_name),
            classes (id, name)
          `)
          .in('class_id', classIds)
          .order('day_of_week')
          .order('start_time')

        slots = (timetableSlots || []).map((slot: any) => ({
          ...slot,
          subject: slot.subjects,
          teacher: slot.profiles,
          class: slot.classes
        }))
      }
    } else if (profile.role === 'teacher') {
      // Teacher: Get classes they teach
      const { data: timetableSlots } = await serviceClient
        .from('timetable_slots')
        .select(`
          id, class_id, day_of_week, start_time, end_time, room, notes,
          subjects (id, name, code),
          profiles!timetable_slots_teacher_id_fkey (id, full_name),
          classes (id, name)
        `)
        .eq('teacher_id', profile.id)
        .order('day_of_week')
        .order('start_time')

      if (timetableSlots) {
        slots = timetableSlots.map((slot: any) => ({
          ...slot,
          subject: slot.subjects,
          teacher: slot.profiles,
          class: slot.classes
        }))

        // Extract unique classes
        const classMap = new Map()
        slots.forEach(s => {
          if (s.class && !classMap.has(s.class.id)) {
            classMap.set(s.class.id, s.class)
          }
        })
        classes = Array.from(classMap.values())
      }
    } else {
      // Admin/Staff: Return empty - they use the class selector
      return NextResponse.json({ 
        success: true, 
        slots: [], 
        classes: [],
        role: profile.role,
        message: 'Admin/Staff should use class selector'
      })
    }

    return NextResponse.json({ 
      success: true, 
      slots, 
      classes,
      role: profile.role
    })
  } catch (error) {
    logger.error('Error fetching my timetable', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
