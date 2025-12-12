/**
 * Teacher Assignments API
 * GET /api/teacher/assignments - Get assignments for teacher's classes
 * POST /api/teacher/assignments - Create assignment for teacher's class
 * 
 * Teachers can manage assignments only for their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError, ValidationError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')

    // Get teacher's class IDs
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', authResult.userId)

    const classIds = teacherClasses?.map(c => c.id) || []

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        assignments: [],
        message: 'No classes assigned'
      })
    }

    // Build query
    let query = supabase
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
        category:assignment_categories(id, name, weight)
      `)
      .in('class_id', classIds)
      .order('due_date', { ascending: false })

    if (classId && classIds.includes(classId)) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to fetch assignments:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Add grade count for each assignment
    const enrichedAssignments = await Promise.all(
      (data || []).map(async (assignment: any) => {
        const { count } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', assignment.id)

        return {
          ...assignment,
          graded_count: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      assignments: enrichedAssignments,
      total: enrichedAssignments.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const supabase = createServiceClient()
    const body = await request.json()

    const { class_id, title, description, due_date, max_points, category_id } = body

    if (!class_id || !title) {
      throw new ValidationError('class_id and title are required')
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', class_id)
      .single()

    if (classError || !classData) {
      throw new ValidationError('Class not found')
    }

    if (classData.teacher_id !== authResult.userId) {
      throw new ForbiddenError('You do not have access to this class')
    }

    // Create assignment
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        class_id,
        title,
        description: description || null,
        due_date: due_date || null,
        max_points: max_points || 100,
        category_id: category_id || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create assignment:', { error })
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
