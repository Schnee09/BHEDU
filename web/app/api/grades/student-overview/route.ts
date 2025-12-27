/**
 * Student Grades Overview API (Simplified)
 * GET /api/grades/student-overview
 * 
 * Get overall grades and subject breakdowns for students
 * Uses new schema: grades → subject_id + class_id
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

    // Get all subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, code, name')

    if (!subjects || subjects.length === 0) {
      return NextResponse.json({
        success: true,
        student_grades: []
      })
    }

    // Get student grades
    const studentGrades = await Promise.all(
      studentIds.map(async (sid) => {
        // Get student info
        const { data: student } = await supabase
          .from('profiles')
          .select('id, email, full_name, student_code')
          .eq('id', sid)
          .single()

        if (!student) return null

        // Get grades for this student in this class
        const { data: grades } = await supabase
          .from('grades')
          .select(`
            score,
            points_earned,
            component_type,
            subject_id
          `)
          .eq('student_id', sid)
          .eq('class_id', classId)

        // Group by subject
        const subjectGrades: Record<string, { name: string; scores: number[] }> = {}
        
        // Initialize all subjects
        subjects.forEach(sub => {
          subjectGrades[sub.id] = { name: sub.name || sub.code, scores: [] }
        })

        // Add scores to subjects
        grades?.forEach(g => {
          const subId = g.subject_id
          if (subId && subjectGrades[subId]) {
            // Score is already 0-10 scale (normalized)
            const score = g.points_earned ?? g.score ?? 0
            subjectGrades[subId].scores.push(score)
          }
        })

        // Calculate averages per subject (10-point scale → percentage)
        const category_grades = Object.entries(subjectGrades).map(([subId, data]) => {
          const avgScore = data.scores.length > 0
            ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
            : 0
          
          // 10-point scale: multiply by 10 for percentage
          const percentage = avgScore * 10
          
          return {
            category_id: subId,
            category_name: data.name,
            percentage: Math.round(percentage * 10) / 10,
            letter_grade: percentage >= 80 ? 'A' : percentage >= 65 ? 'B' : percentage >= 50 ? 'C' : percentage >= 35 ? 'D' : 'F',
            points_earned: Math.round(avgScore * 10) / 10,
            total_points: 10
          }
        }).filter(c => c.points_earned > 0) // Only include subjects with grades

        // Overall: average of all subject percentages
        const overall_percentage = category_grades.length > 0
          ? category_grades.reduce((sum, c) => sum + c.percentage, 0) / category_grades.length
          : 0
        
        const letter_grade = overall_percentage >= 80 ? 'A' : overall_percentage >= 65 ? 'B' : overall_percentage >= 50 ? 'C' : overall_percentage >= 35 ? 'D' : 'F'

        return {
          student_id: sid,
          student_name: student.full_name || student.email || '',
          student_number: student.student_code || '',
          overall_percentage: Math.round(overall_percentage * 10) / 10,
          letter_grade,
          category_grades
        }
      })
    )

    const validGrades = studentGrades.filter(g => g !== null)

    return NextResponse.json({
      success: true,
      data: validGrades,
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
