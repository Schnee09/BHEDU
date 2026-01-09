/**
 * Timetable Slot by ID API
 * PUT /api/timetable/[id] - Update a timetable slot
 * DELETE /api/timetable/[id] - Delete a timetable slot
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
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, notes } = body

    const supabase = createClientFromRequest(req)

    const { data: slot, error } = await supabase
      .from('timetable_slots')
      .update({
        class_id,
        subject_id,
        teacher_id,
        day_of_week,
        start_time,
        end_time,
        room,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('Error updating timetable slot:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const transformedSlot = {
      ...slot,
      subject: (slot as any).subjects,
      teacher: (slot as any).profiles
    }

    return NextResponse.json({ success: true, slot: transformedSlot })
  } catch (error: any) {
    console.error('Error in PUT /api/timetable/[id]:', error)
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
      .from('timetable_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting timetable slot:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/timetable/[id]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
