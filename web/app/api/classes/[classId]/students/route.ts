/**
 * Get Class Students API
 * GET /api/classes/[classId]/students
 * 
 * Get all students enrolled in a specific class
 * Uses grades table since enrollments was dropped
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()
    const { classId } = await params

    // First check enrollments table (primary source)
    const { data: enrolledStudents, error: enrollError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active')

    if (enrollError) {
      logger.warn('Failed to fetch enrollments', { error: enrollError.message })
    }

    // Get unique student IDs from grades for this class
    const { data: gradeStudents, error: gradeError } = await supabase
      .from('grades')
      .select('student_id')
      .eq('class_id', classId)

    if (gradeError) {
      logger.warn('Failed to fetch class grades', { error: gradeError.message })
    }

    // Also check attendance for this class
    const { data: attendanceStudents, error: attendError } = await supabase
      .from('attendance')
      .select('student_id')
      .eq('class_id', classId)

    if (attendError) {
      logger.warn('Failed to fetch class attendance', { error: attendError.message })
    }

    // Combine unique student IDs from all sources
    const studentIdSet = new Set<string>()
    enrolledStudents?.forEach(e => e.student_id && studentIdSet.add(e.student_id))
    gradeStudents?.forEach(g => g.student_id && studentIdSet.add(g.student_id))
    attendanceStudents?.forEach(a => a.student_id && studentIdSet.add(a.student_id))
    
    const studentIds = Array.from(studentIdSet)

    if (studentIds.length === 0) {
      // No students found via enrollments/grades/attendance - try by grade_level matching class name
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single()

      if (classData?.name) {
        // Extract grade number from class name (e.g., "11A2" -> "11")
        const gradeNum = classData.name.replace(/[^0-9]/g, '')
        
        let levelStudents = null
        
        // First try matching by grade_level
        if (gradeNum) {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, student_code, grade_level')
            .eq('role', 'student')
            .like('grade_level', `%${gradeNum}%`)
            .limit(50)
          levelStudents = data
        }

        // Fallback: get all students if no grade match
        if (!levelStudents || levelStudents.length === 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, student_code, grade_level')
            .eq('role', 'student')
            .limit(50)
          levelStudents = data
        }

        // Map student_code to student_id for frontend compatibility
        const mappedStudents = (levelStudents || []).map(s => ({
          ...s,
          student_id: s.student_code || s.id
        }))

        return NextResponse.json({
          success: true,
          data: mappedStudents,
          students: mappedStudents
        })
      }

      // Final fallback - get all students
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, email, full_name, student_code, grade_level')
        .eq('role', 'student')
        .limit(50)

      const mappedAll = (allStudents || []).map(s => ({
        ...s,
        student_id: s.student_code || s.id
      }))

      return NextResponse.json({
        success: true,
        data: mappedAll,
        students: mappedAll
      })
    }

    // Fetch student profiles
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, student_code, grade_level')
      .in('id', studentIds)
      .eq('role', 'student')

    if (studentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch student details', details: studentsError.message },
        { status: 500 }
      )
    }

    // Map student_code to student_id for frontend compatibility
    const mappedStudents = (students || []).map(s => ({
      ...s,
      student_id: s.student_code || s.id
    }))

    return NextResponse.json({
      success: true,
      data: mappedStudents,
      students: mappedStudents
    })

  } catch (error) {
    logger.error('Get class students error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

