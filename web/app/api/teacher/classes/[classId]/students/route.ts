/**
 * Teacher Class Students API
 * GET /api/teacher/classes/[classId]/students - Get students in class
 * 
 * Teachers can view and manage students in their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { classId } = await params
    const supabase = createServiceClient()

    // Verify class ownership
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, teacher_id')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      throw new NotFoundError('Class not found')
    }

    if (classData.teacher_id !== authResult.userId) {
      throw new ForbiddenError('You do not have access to this class')
    }

    // Get enrolled students with their grades and attendance summary
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        student:profiles!enrollments_student_id_fkey(
          id,
          email,
          full_name,
          avatar_url,
          student_code
        )
      `)
      .eq('class_id', classId)

    if (error) {
      logger.error('Failed to fetch students:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Enrich with grades and attendance for each student
    const enrichedStudents = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const studentId = enrollment.student?.id
        if (!studentId) return null

        // Get attendance summary for this student in this class
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('class_id', classId)
          .eq('student_id', studentId)

        const attendanceStats = {
          total: attendance?.length || 0,
          present: attendance?.filter((a: any) => a.status === 'present').length || 0,
          absent: attendance?.filter((a: any) => a.status === 'absent').length || 0,
          late: attendance?.filter((a: any) => a.status === 'late').length || 0
        }

        // Get average grade for this student in this class
        const { data: grades } = await supabase
          .from('grades')
          .select(`
            score,
            assignment:assignments!inner(class_id, max_points)
          `)
          .eq('student_id', studentId)
          .eq('assignment.class_id', classId)

        let averageGrade = null
        if (grades && grades.length > 0) {
          const totalPercent = grades.reduce((sum: number, g: any) => {
            return sum + (g.score / g.assignment.max_points) * 100
          }, 0)
          averageGrade = Math.round(totalPercent / grades.length)
        }

        return {
          id: enrollment.id,
          student_id: studentId,
          enrolled_at: enrollment.enrolled_at,
          email: enrollment.student.email,
          full_name: enrollment.student.full_name,
          avatar_url: enrollment.student.avatar_url,
          student_code: enrollment.student.student_code,
          attendance: attendanceStats,
          average_grade: averageGrade,
          grade_count: grades?.length || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name
      },
      students: enrichedStudents.filter(Boolean),
      total: enrichedStudents.filter(Boolean).length
    })

  } catch (error) {
    return handleApiError(error)
  }
}
