/**
 * Grades API
 * GET/POST/PUT /api/grades
 * 
 * Manage student grades for assignments
 * Updated: 2025-11-14
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')

    let query = supabase
      .from('grades')
      .select(`
        *,
        assignment:assignments(
          id,
          title,
          total_points,
          due_date,
          class_id,
          category:assignment_categories(
            id,
            name
          )
        ),
        student:profiles!grades_student_id_fkey(
          id,
          email,
          full_name,
          student_id,
          grade_level
        )
      `)

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (classId) {
      query = query.filter('assignment.class_id', 'eq', classId)
    }

    // Verify access
    if (authResult.userRole !== 'admin') {
      // Get teacher's classes
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', authResult.userId)

      const classIds = teacherClasses?.map(c => c.id) || []
      
      if (classIds.length === 0) {
        return NextResponse.json({ success: true, grades: [] })
      }
    }

    const { data: grades, error } = await query

    if (error) {
      logger.error('Failed to fetch grades:', error)
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      grades: grades || []
    })
  } catch (error) {
    logger.error('Grades API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { grades: gradesData } = body

    if (!Array.isArray(gradesData) || gradesData.length === 0) {
      return NextResponse.json(
        { error: 'grades array is required' },
        { status: 400 }
      )
    }

  const supabase = createServiceClient()

    // Validate all grades
    for (const grade of gradesData) {
      if (!grade.assignment_id || !grade.student_id) {
        return NextResponse.json(
          { error: 'Each grade must have assignment_id and student_id' },
          { status: 400 }
        )
      }

      if (grade.points_earned !== null && grade.points_earned !== undefined) {
        if (grade.points_earned < 0) {
          return NextResponse.json(
            { error: 'points_earned cannot be negative' },
            { status: 400 }
          )
        }
      }
    }

    // Verify teacher has access to all assignments
    const assignmentIds = [...new Set(gradesData.map(g => g.assignment_id))]
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, class_id, total_points, classes!inner(teacher_id)')
      .in('id', assignmentIds)

    if (!assignments || assignments.length !== assignmentIds.length) {
      return NextResponse.json(
        { error: 'Invalid assignment IDs' },
        { status: 400 }
      )
    }

    // Check teacher access
    if (authResult.userRole !== 'admin') {
      const hasAccess = (assignments as Array<{ classes: Array<{ teacher_id: string }> }>).every((a) => 
        a.classes.length > 0 && a.classes[0].teacher_id === authResult.userId
      )
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Validate points don't exceed total_points
    for (const grade of gradesData) {
      if (grade.points_earned !== null && grade.points_earned !== undefined) {
        const assignment = (assignments as Array<{ id: string; total_points: number }>).find((a) => a.id === grade.assignment_id)
        if (assignment && grade.points_earned > assignment.total_points) {
          return NextResponse.json(
            { error: `Points cannot exceed ${assignment.total_points} for assignment ${grade.assignment_id}` },
            { status: 400 }
          )
        }
      }
    }

    // Upsert grades
    const gradeRecords = gradesData.map(grade => ({
      assignment_id: grade.assignment_id,
      student_id: grade.student_id,
      points_earned: grade.points_earned ?? null,
      late: grade.late ?? false,
      excused: grade.excused ?? false,
      missing: grade.missing ?? false,
      feedback: grade.feedback || null,
      graded_at: grade.points_earned !== null ? new Date().toISOString() : null,
      graded_by: authResult.userId
    }))

    const { data: savedGrades, error } = await supabase
      .from('grades')
      .upsert(gradeRecords, {
        onConflict: 'assignment_id,student_id'
      })
      .select()

    if (error) {
      logger.error('Failed to save grades:', error)
      return NextResponse.json(
        { error: 'Failed to save grades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      grades: savedGrades,
      count: savedGrades?.length || 0
    })
  } catch (error) {
    logger.error('Save grades error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
