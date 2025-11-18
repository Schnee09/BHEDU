/**
 * Admin Individual Attendance Record API
 * GET /api/admin/attendance/[id] - Get attendance record details
 * PATCH /api/admin/attendance/[id] - Update attendance record
 * DELETE /api/admin/attendance/[id] - Delete attendance record
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
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

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params

    const { data: record, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        enrollment:enrollments!attendance_records_enrollment_id_fkey(
          id,
          student:profiles!enrollments_student_id_fkey(
            id,
            first_name,
            last_name,
            email,
            student_number
          ),
          class:classes!enrollments_class_id_fkey(
            id,
            name,
            code,
            grade_level,
            teacher:profiles!classes_teacher_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !record) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      record
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

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params
    const body = await request.json()

    // Verify record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance_records')
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
      .from('attendance_records')
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

    const supabase = createClientFromRequest(request as any)
    const { id } = await context.params

    // Check if record exists
    const { data: record, error: fetchError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('attendance_records')
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
