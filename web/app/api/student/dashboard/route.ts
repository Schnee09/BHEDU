/**
 * Student Dashboard API
 * GET /api/student/dashboard - Get student's dashboard with their data
 * 
 * Students can only see their own data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    // teacherAuth allows students too
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'student') {
      throw new ForbiddenError('This endpoint is for students only')
    }

    const supabase = createServiceClient()
    const studentId = authResult.userId!

    // Get enrolled classes
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        class:classes(
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(id, full_name)
        )
      `)
      .eq('student_id', studentId)

    const classIds = enrollments?.map((e: any) => e.class?.id).filter(Boolean) || []

    // Get overall attendance stats
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, date')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(30)

    const attendanceStats = {
      total: attendance?.length || 0,
      present: attendance?.filter(a => a.status === 'present').length || 0,
      absent: attendance?.filter(a => a.status === 'absent').length || 0,
      late: attendance?.filter(a => a.status === 'late').length || 0
    }
    const attendanceRate = attendanceStats.total > 0 
      ? Math.round((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100) 
      : 100

    // Get recent grades
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        id,
        score,
        graded_at,
        assignment:assignments(
          id,
          title,
          max_points,
          due_date,
          class:classes(id, name)
        )
      `)
      .eq('student_id', studentId)
      .order('graded_at', { ascending: false })
      .limit(10)

    // Calculate overall average grade
    let overallAverage = null
    if (grades && grades.length > 0) {
      const totalPercent = grades.reduce((sum, g: any) => {
        return sum + (g.score / g.assignment?.max_points) * 100
      }, 0)
      overallAverage = Math.round(totalPercent / grades.length)
    }

    // Get upcoming assignments
    const { data: upcomingAssignments } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        max_points,
        class:classes(id, name)
      `)
      .in('class_id', classIds.length > 0 ? classIds : ['none'])
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5)

    // Get student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_code, avatar_url')
      .eq('id', studentId)
      .single()

    return NextResponse.json({
      success: true,
      dashboard: {
        profile,
        enrolled_classes: enrollments?.map((e: any) => ({
          id: e.class?.id,
          name: e.class?.name,
          teacher: e.class?.teacher?.full_name,
          enrolled_at: e.enrolled_at
        })) || [],
        attendance: {
          ...attendanceStats,
          rate: attendanceRate,
          recent: attendance?.slice(0, 5) || []
        },
        grades: {
          overall_average: overallAverage,
          total_graded: grades?.length || 0,
          recent: grades?.map((g: any) => ({
            id: g.id,
            assignment: g.assignment?.title,
            class: g.assignment?.class?.name,
            score: g.score,
            max_points: g.assignment?.max_points,
            percentage: Math.round((g.score / g.assignment?.max_points) * 100),
            graded_at: g.graded_at
          })) || []
        },
        upcoming_assignments: upcomingAssignments?.map((a: any) => ({
          id: a.id,
          title: a.title,
          class: a.class?.name,
          due_date: a.due_date,
          max_points: a.max_points
        })) || []
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
