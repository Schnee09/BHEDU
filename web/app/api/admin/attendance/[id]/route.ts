/**
 * Admin Individual Attendance Record API
 * GET /api/admin/attendance/[id] - Get attendance record details
 * PATCH /api/admin/attendance/[id] - Update attendance record
 * DELETE /api/admin/attendance/[id] - Delete attendance record
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { id } = await context.params

    const { data: record, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(
          id,
          full_name,
          email,
          student_code
        )
      `)
      .eq('id', id)
      .single()

    if (error || !record) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Fetch class info separately since there's no FK constraint
    let classInfo = null;
    if (record.class_id) {
      const { data: classData } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(
            full_name
          )
        `)
        .eq('id', record.class_id)
        .single();
      
      classInfo = classData;
    }

    // Attach class info to record
    const recordWithClass = {
      ...record,
      class: classInfo
    };

    return NextResponse.json({
      success: true,
      record: recordWithClass
    })

  } catch (error) {
    console.error('Error in GET /api/admin/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { id } = await context.params
    const body = await request.json()

    // Verify record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Allowed fields to update
    const allowedFields = ['status', 'notes', 'date']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating attendance record:', updateError)
      return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      record: updatedRecord
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { id } = await context.params

    // Check if record exists
    const { data: record, error: fetchError } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting attendance record:', deleteError)
      return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
