/**
 * Course Management API - Individual Operations
 * GET /api/admin/courses/[id] - Get course details
 * PUT /api/admin/courses/[id] - Update course
 * DELETE /api/admin/courses/[id] - Delete course
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { mapCourseToAPI, type Course } from '@/lib/database.types'
import { validateTitle, validateDescription, ValidationError } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get course details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
  const { supabase } = await getDataClient(req)

    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !course) {
      throw new NotFoundError('Course not found')
    }

    return NextResponse.json({ 
      success: true, 
      data: mapCourseToAPI(course as Course) 
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: Update course
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
  const { supabase } = await getDataClient(req)
    const body = await req.json()

    // Verify course exists
    const { data: existingCourse, error: findError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existingCourse) {
      throw new NotFoundError('Course not found')
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    try {
      if (body.title !== undefined) {
        updates.name = validateTitle(body.title)
      }
      if (body.description !== undefined) {
        updates.description = body.description ? validateDescription(body.description) : null
      }
      if (body.subject_id !== undefined) {
        updates.subject_id = typeof body.subject_id === 'string' ? body.subject_id : null
      }
      if (body.teacher_id !== undefined) {
        updates.teacher_id = typeof body.teacher_id === 'string' ? body.teacher_id : null
      }
      if (body.academic_year_id !== undefined) {
        updates.academic_year_id = typeof body.academic_year_id === 'string' ? body.academic_year_id : null
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update course', { error: updateError, id })
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    logger.info('Course updated', { courseId: id })

    return NextResponse.json({
      success: true,
      data: mapCourseToAPI(updatedCourse as Course),
      message: 'Course updated successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE: Delete course
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
  const { supabase } = await getDataClient(req)

    // Verify course exists
    const { data: existingCourse, error: findError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', id)
      .single()

    if (findError || !existingCourse) {
      throw new NotFoundError('Course not found')
    }

    // Delete the course
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Failed to delete course', { error: deleteError, id })
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    logger.info('Course deleted', { courseId: id, courseName: existingCourse.name })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}
