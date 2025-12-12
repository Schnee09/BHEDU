/**
 * Teacher Individual Assignment API
 * GET /api/teacher/assignments/[id] - Get assignment with grades
 * PATCH /api/teacher/assignments/[id] - Update assignment
 * DELETE /api/teacher/assignments/[id] - Delete assignment
 * 
 * Teachers can only manage assignments for their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

async function verifyAssignmentOwnership(supabase: any, assignmentId: string, teacherId: string) {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      class_id,
      class:classes(id, teacher_id)
    `)
    .eq('id', assignmentId)
    .single()

  if (error || !assignment) {
    throw new NotFoundError('Assignment not found')
  }

  if (assignment.class?.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not have access to this assignment')
  }

  return assignment
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { id } = await params
    const supabase = createServiceClient()

    await verifyAssignmentOwnership(supabase, id, authResult.userId!)

    // Get full assignment details with grades
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        max_points,
        class_id,
        category_id,
        created_at,
        class:classes(id, name),
        category:assignment_categories(id, name, weight),
        grades:grades(
          id,
          score,
          graded_at,
          student:profiles!grades_student_id_fkey(id, full_name, email)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Failed to fetch assignment:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Get enrolled students who haven't been graded
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student:profiles!enrollments_student_id_fkey(id, full_name, email)
      `)
      .eq('class_id', assignment.class_id)

    const gradedStudentIds = new Set((assignment.grades || []).map((g: any) => g.student?.id))
    const ungradedStudents = (enrollments || [])
      .filter((e: any) => e.student && !gradedStudentIds.has(e.student.id))
      .map((e: any) => e.student)

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        ungraded_students: ungradedStudents,
        total_students: enrollments?.length || 0,
        graded_count: assignment.grades?.length || 0
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { id } = await params
    const supabase = createServiceClient()

    await verifyAssignmentOwnership(supabase, id, authResult.userId!)

    const body = await request.json()
    
    // Allowed update fields
    const allowedFields = ['title', 'description', 'due_date', 'max_points', 'category_id']
    const updates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes' })
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update assignment:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      assignment: data
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { id } = await params
    const supabase = createServiceClient()

    await verifyAssignmentOwnership(supabase, id, authResult.userId!)

    // Delete grades first (if any)
    await supabase.from('grades').delete().eq('assignment_id', id)

    // Delete assignment
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete assignment:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted'
    })

  } catch (error) {
    return handleApiError(error)
  }
}
