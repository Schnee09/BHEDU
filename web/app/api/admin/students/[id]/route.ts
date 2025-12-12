/**
 * Student Management API
 * GET /api/admin/students/[id] - Get student details
 * PUT /api/admin/students/[id] - Update student profile
 * DELETE /api/admin/students/[id] - Archive student (soft delete)
 * Updated: 2025-12-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { updateStudentSchema } from '@/lib/schemas/students'

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
  const { supabase } = await getDataClient(req)

    const { data: student, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (error || !student) {
      throw new NotFoundError('Student not found')
    }

    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    return handleApiError(error)
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
  const { supabase } = await getDataClient(req)
    const body = await req.json()
    
    // Validate request body
    const validatedData = updateStudentSchema.parse({ id, ...body })

    // Validate student exists and is a student
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('id, role, full_name, first_name, last_name')
      .eq('id', id)
      .single()

    if (!existingStudent || existingStudent.role !== 'student') {
      throw new NotFoundError('Student not found')
    }

    // Validate student_code uniqueness if provided
    if (validatedData.student_code) {
      const { data: duplicateCheck } = await supabase
        .from('profiles')
        .select('id, student_code')
        .eq('student_code', validatedData.student_code)
        .neq('id', id)
        .maybeSingle()

      if (duplicateCheck) {
        return NextResponse.json(
          { error: `Student code ${validatedData.student_code} is already in use` },
          { status: 400 }
        )
      }
    }

    // Validate email uniqueness if changed
    if (validatedData.email) {
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', validatedData.email.toLowerCase())
        .neq('id', id)
        .maybeSingle()

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }
    }

    // Build update object from validated data (exclude id)
    const { id: _id, ...updateData } = validatedData
    
    // Perform update
    const { data: updatedStudent, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update student:', updateError)
      throw new Error(`Failed to update student: ${updateError.message}`)
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
    return handleApiError(error)
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
  const { supabase } = await getDataClient(req)

    // Validate student exists
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', id)
      .single()

    if (!existingStudent || existingStudent.role !== 'student') {
      throw new NotFoundError('Student not found')
    }

    // Soft delete: set status to inactive
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (updateError) {
      logger.error('Failed to archive student:', updateError)
      throw new Error(`Failed to archive student: ${updateError.message}`)
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
    return handleApiError(error)
  }
}
