/**
 * Student Classes API
 * GET /api/student/classes - Get student's enrolled classes
 * 
 * Students can only see their enrolled classes
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

    // Get enrolled classes with teacher info
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrollment_date,
        status,
        class:classes(
          id,
          name,
          code,
          created_at,
          teacher_id,
          teacher:profiles!classes_teacher_id_fkey(id, full_name, email)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')

    if (error) {
      logger.error('Failed to fetch student classes:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Enrich with student's stats per class
    const enrichedClasses = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const classData = enrollment.class
        if (!classData) return null

        // Get attendance for this class
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('class_id', classData.id)
          .eq('student_id', studentId)

        const attendanceStats = {
          total: attendance?.length || 0,
          present: attendance?.filter(a => a.status === 'present').length || 0,
          absent: attendance?.filter(a => a.status === 'absent').length || 0,
          late: attendance?.filter(a => a.status === 'late').length || 0
        }

        // Get grades for this class
        const { data: grades } = await supabase
          .from('grades')
          .select(`
            score,
            assignment:assignments!inner(class_id, max_points)
          `)
          .eq('student_id', studentId)
          .eq('assignment.class_id', classData.id)

        let averageGrade = null
        if (grades && grades.length > 0) {
          const totalPercent = grades.reduce((sum: number, g: any) => {
            return sum + (g.score / g.assignment.max_points) * 100
          }, 0)
          averageGrade = Math.round(totalPercent / grades.length)
        }

        // Get pending assignments
        const { count: pendingCount } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classData.id)
          .gte('due_date', new Date().toISOString().split('T')[0])

        return {
          // Match ClassData interface expected by the page
          id: classData.id,
          name: classData.name,
          code: classData.code || `CLS-${classData.id.substring(0, 6)}`,
          created_at: classData.created_at,
          teacher_id: classData.teacher_id,
          teacher: {
            full_name: classData.teacher?.full_name || 'Not assigned',
            email: classData.teacher?.email || ''
          },
          // Additional student-specific data
          enrollment_id: enrollment.id,
          enrolled_at: enrollment.enrollment_date,
          attendance: attendanceStats,
          attendance_rate: attendanceStats.total > 0 
            ? Math.round((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100) 
            : 100,
          average_grade: averageGrade,
          grades_count: grades?.length || 0,
          pending_assignments: pendingCount || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      classes: enrichedClasses.filter(Boolean),
      total: enrichedClasses.filter(Boolean).length
    })

  } catch (error) {
    return handleApiError(error)
  }
}
