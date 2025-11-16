/**
 * Student Grades Overview API
 * GET /api/grades/student-overview
 * 
 * Get overall grades and category breakdowns for students
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server'
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

    const supabase = createClientFromRequest(request as any)
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')

    if (!classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      )
    }

    // Verify teacher has access to this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (!classData || (classData.teacher_id !== authResult.userId && authResult.userRole !== 'admin')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get students to calculate grades for
    let studentIds: string[] = []
    if (studentId) {
      studentIds = [studentId]
    } else {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId)

      studentIds = enrollments?.map(e => e.student_id) || []
    }

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        student_grades: []
      })
    }

    // Calculate overall grades for each student
    const studentGrades = await Promise.all(
      studentIds.map(async (sid) => {
        const { data, error } = await supabase
          .rpc('calculate_overall_grade', {
            p_class_id: classId,
            p_student_id: sid
          })
          .single()

        if (error) {
          logger.error(`Failed to calculate grade for student ${sid}:`, error)
          return null
        }

        // Get student info
        const { data: student } = await supabase
          .from('profiles')
          .select('id, email, full_name, student_id, grade_level')
          .eq('id', sid)
          .single()

        // Type assertion for the RPC result
        const gradeData = data as { overall_percentage: number | null; letter_grade: string | null; category_grades: unknown[] } | null

        return {
          student,
          overall_percentage: gradeData?.overall_percentage || null,
          letter_grade: gradeData?.letter_grade || null,
          category_grades: gradeData?.category_grades || []
        }
      })
    )

    const validGrades = studentGrades.filter(g => g !== null)

    return NextResponse.json({
      success: true,
      student_grades: validGrades
    })
  } catch (error) {
    logger.error('Student overview API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
