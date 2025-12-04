/**
 * Admin Single Class API
 * CRUD operations for a specific class (admin only)
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

// GET /api/admin/classes/[id] - Get single class details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const resolvedParams = await params
    const supabase = createServiceClient()
    const { id } = resolvedParams

    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(
          id,
          full_name,
          email
        ),
        academic_year:academic_years(
          id,
          name
        ),
        enrollments(
          id,
          student:profiles!enrollments_student_id_fkey(
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch class', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      class: classData
    })

  } catch (error) {
    logger.error('Get class error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/classes/[id] - Update class
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const resolvedParams = await params
    const supabase = createServiceClient()
    const { id } = resolvedParams
    const body = await request.json()

    // Check if class exists
    const { data: existing, error: fetchError } = await supabase
      .from('classes')
      .select('id, code')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check if code is being changed and is unique
    if (body.code && body.code !== existing.code) {
      const { data: codeExists } = await supabase
        .from('classes')
        .select('id')
        .eq('code', body.code)
        .neq('id', id)
        .single()

      if (codeExists) {
        return NextResponse.json(
          { error: 'Class code already exists' },
          { status: 409 }
        )
      }
    }

    // Verify teacher if being changed
    if (body.teacher_id) {
      const { data: teacher, error: teacherError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', body.teacher_id)
        .single()

      if (teacherError || !teacher || teacher.role !== 'teacher') {
        return NextResponse.json(
          { error: 'Invalid teacher ID or user is not a teacher' },
          { status: 400 }
        )
      }
    }

    // Verify academic year if being changed
    if (body.academic_year_id) {
      const { data: academicYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('id', body.academic_year_id)
        .single()

      if (yearError || !academicYear) {
        return NextResponse.json(
          { error: 'Invalid academic year ID' },
          { status: 400 }
        )
      }
    }

    // Update class
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    const allowedFields = [
      'name', 'code', 'description', 'grade_level', 'status',
      'teacher_id', 'academic_year_id', 'room_number', 'schedule', 'max_students'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data: updatedClass, error: updateError } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update class', { error: updateError.message, classId: id })
      return NextResponse.json(
        { error: 'Failed to update class', details: updateError.message },
        { status: 500 }
      )
    }

    logger.info('Class updated', { classId: id })

    return NextResponse.json({
      success: true,
      class: updatedClass
    })

  } catch (error) {
    logger.error('Update class error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/classes/[id] - Delete class
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const resolvedParams = await params
    const supabase = createServiceClient()
    const { id } = resolvedParams

    // Check if class has enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', id)
      .limit(1)

    if (enrollError) {
      return NextResponse.json(
        { error: 'Failed to check enrollments', details: enrollError.message },
        { status: 500 }
      )
    }

    if (enrollments && enrollments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with active enrollments. Archive it instead.' },
        { status: 409 }
      )
    }

    // Delete class
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Failed to delete class', { error: deleteError.message, classId: id })
      return NextResponse.json(
        { error: 'Failed to delete class', details: deleteError.message },
        { status: 500 }
      )
    }

    logger.info('Class deleted', { classId: id })

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    })

  } catch (error) {
    logger.error('Delete class error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
