/**
 * Student Management API
 * GET /api/admin/students/[id] - Get student details
 * PUT /api/admin/students/[id] - Update student profile
 * DELETE /api/admin/students/[id] - Archive student (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createClientFromRequest(req as any)

    const { data: student, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (error || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    logger.error('Failed to fetch student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createClientFromRequest(req as any)
    const body = await req.json()

    // Validate student exists and is a student
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('id', id)
      .single()

    if (!existingStudent || existingStudent.role !== 'student') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Validate student_id uniqueness if provided and changed
    if (body.student_id) {
      const { data: duplicateCheck } = await supabase
        .from('profiles')
        .select('id, student_id')
        .eq('student_id', body.student_id)
        .neq('id', id)
        .maybeSingle()

      if (duplicateCheck) {
        return NextResponse.json(
          { error: `Student ID ${body.student_id} is already in use` },
          { status: 400 }
        )
      }
    }

    // Validate email uniqueness if changed
    if (body.email) {
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', body.email.toLowerCase())
        .neq('id', id)
        .maybeSingle()

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }
    }

    // Build update object with allowed fields
    const updateData: Record<string, any> = {}
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'address',
      'date_of_birth', 'gender', 'student_id', 'grade_level',
      'status', 'enrollment_date', 'notes', 'photo_url'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Update full_name if first/last name changed
    if (body.first_name || body.last_name) {
      const firstName = body.first_name || existingStudent.first_name || ''
      const lastName = body.last_name || existingStudent.last_name || ''
      updateData.full_name = `${firstName} ${lastName}`.trim()
    }

    // Perform update
    const { data: updatedStudent, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update student:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update student' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'update',
      resource_type: 'student',
      resource_id: id,
      details: { updated_fields: Object.keys(updateData) }
    })

    logger.info('Student updated successfully', { studentId: id, userId: authResult.userId })

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully'
    })
  } catch (error) {
    logger.error('Failed to update student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createClientFromRequest(req as any)

    // Validate student exists
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', id)
      .single()

    if (!existingStudent || existingStudent.role !== 'student') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Soft delete: set status to inactive
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (updateError) {
      logger.error('Failed to archive student:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to archive student' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      actor_id: authResult.userId,
      action: 'delete',
      resource_type: 'student',
      resource_id: id,
      details: { 
        action: 'archived',
        student_name: existingStudent.full_name
      }
    })

    logger.info('Student archived successfully', { studentId: id, userId: authResult.userId })

    return NextResponse.json({
      success: true,
      message: 'Student archived successfully'
    })
  } catch (error) {
    logger.error('Failed to archive student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
