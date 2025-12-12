/**
 * Teacher Grades API
 * GET /api/teacher/grades - Get grades for teacher's classes
 * POST /api/teacher/grades - Enter/update grades for assignments
 * 
 * Teachers can only manage grades for their own classes
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
    const assignmentId = searchParams.get('assignment_id')
    const studentId = searchParams.get('student_id')

    // Get teacher's class IDs
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', authResult.userId)

    const classIds = teacherClasses?.map(c => c.id) || []

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        grades: [],
        message: 'No classes assigned'
      })
    }

    // Build query
    let query = supabase
      .from('grades')
      .select(`
        id,
        score,
        graded_at,
        feedback,
        assignment_id,
        student_id,
        assignment:assignments!inner(
          id,
          title,
          max_points,
          due_date,
          class_id,
          class:classes(id, name)
        ),
        student:profiles!grades_student_id_fkey(id, full_name, email, student_code)
      `)
      .in('assignment.class_id', classIds)

    if (classId && classIds.includes(classId)) {
      query = query.eq('assignment.class_id', classId)
    }

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data, error } = await query.order('graded_at', { ascending: false }).limit(100)

    if (error) {
      logger.error('Failed to fetch grades:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      grades: data || [],
      total: data?.length || 0
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

    // Support both single and bulk grade entry
    const grades = Array.isArray(body) ? body : [body]

    if (grades.length === 0) {
      throw new ValidationError('At least one grade is required')
    }

    // Get teacher's class IDs for validation
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', authResult.userId)

    const classIds = new Set(teacherClasses?.map(c => c.id) || [])

    // Validate and prepare grades
    const validatedGrades = []
    
    for (const grade of grades) {
      const { assignment_id, student_id, score, feedback } = grade

      if (!assignment_id || !student_id || score === undefined) {
        throw new ValidationError('assignment_id, student_id, and score are required')
      }

      // Verify assignment belongs to teacher's class
      const { data: assignment, error: assignError } = await supabase
        .from('assignments')
        .select('id, class_id, max_points')
        .eq('id', assignment_id)
        .single()

      if (assignError || !assignment) {
        throw new ValidationError(`Assignment ${assignment_id} not found`)
      }

      if (!classIds.has(assignment.class_id)) {
        throw new ForbiddenError(`You do not have access to assignment ${assignment_id}`)
      }

      // Validate score
      if (score < 0 || score > assignment.max_points) {
        throw new ValidationError(`Score must be between 0 and ${assignment.max_points}`)
      }

      validatedGrades.push({
        assignment_id,
        student_id,
        score,
        feedback: feedback || null,
        graded_at: new Date().toISOString(),
        graded_by: authResult.userId
      })
    }

    // Upsert grades
    const { data, error } = await supabase
      .from('grades')
      .upsert(validatedGrades, {
        onConflict: 'assignment_id,student_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      logger.error('Failed to save grades:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${validatedGrades.length} grade(s)`,
      grades: data
    })

  } catch (error) {
    return handleApiError(error)
  }
}
