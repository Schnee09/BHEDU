/**
 * Student Grades API
 * GET /api/student/grades - Get student's own grades
 * 
 * Students can only see their own grades
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'student') {
      throw new ForbiddenError('This endpoint is for students only')
    }

    const supabase = createServiceClient()
    const studentId = authResult.userId!
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')

    // Build query
    let query = supabase
      .from('grades')
      .select(`
        id,
        score,
        graded_at,
        feedback,
        assignment:assignments(
          id,
          title,
          description,
          max_points,
          due_date,
          class_id,
          class:classes(id, name),
          category:assignment_categories(id, name, weight)
        )
      `)
      .eq('student_id', studentId)
      .order('graded_at', { ascending: false })

    if (classId) {
      query = query.eq('assignment.class_id', classId)
    }

    const { data: grades, error } = await query

    if (error) {
      logger.error('Failed to fetch student grades:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Group by class for summary
    const classSummary: Record<string, any> = {}
    
    for (const grade of grades || []) {
      const assignment = (grade as any).assignment
      if (!assignment) continue
      
      const classData = assignment.class
      if (!classData) continue
      
      if (!classSummary[classData.id]) {
        classSummary[classData.id] = {
          class_id: classData.id,
          class_name: classData.name,
          total_grades: 0,
          total_points_earned: 0,
          total_points_possible: 0,
          grades: []
        }
      }
      
      classSummary[classData.id].total_grades++
      classSummary[classData.id].total_points_earned += grade.score
      classSummary[classData.id].total_points_possible += assignment.max_points
      classSummary[classData.id].grades.push({
        id: grade.id,
        assignment_title: assignment.title,
        category: assignment.category?.name || 'Uncategorized',
        score: grade.score,
        max_points: assignment.max_points,
        percentage: Math.round((grade.score / assignment.max_points) * 100),
        due_date: assignment.due_date,
        graded_at: grade.graded_at,
        feedback: grade.feedback
      })
    }

    // Calculate averages
    const summaryArray = Object.values(classSummary).map((cls: any) => ({
      ...cls,
      average: cls.total_points_possible > 0 
        ? Math.round((cls.total_points_earned / cls.total_points_possible) * 100) 
        : null
    }))

    // Overall stats
    const totalPoints = summaryArray.reduce((sum, cls: any) => sum + cls.total_points_earned, 0)
    const maxPoints = summaryArray.reduce((sum, cls: any) => sum + cls.total_points_possible, 0)
    const overallAverage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : null

    return NextResponse.json({
      success: true,
      summary: {
        overall_average: overallAverage,
        total_grades: grades?.length || 0,
        by_class: summaryArray
      },
      grades: grades?.map((g: any) => ({
        id: g.id,
        score: g.score,
        graded_at: g.graded_at,
        feedback: g.feedback,
        assignment: {
          id: g.assignment?.id,
          title: g.assignment?.title,
          max_points: g.assignment?.max_points,
          due_date: g.assignment?.due_date,
          class: {
            id: g.assignment?.class?.id,
            name: g.assignment?.class?.name
          },
          category: {
            id: g.assignment?.category?.id,
            name: g.assignment?.category?.name,
            weight: g.assignment?.category?.weight
          }
        }
      })) || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}
