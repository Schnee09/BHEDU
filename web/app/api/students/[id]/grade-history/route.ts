/**
 * Student Grade History API
 * GET /api/students/[id]/grade-history
 * 
 * Returns grade data over time for visualizing student progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: studentId } = await params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // semester, year, all

    const supabase = createServiceClient()

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_code, grade_level')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get all grades for this student with subject info
    let gradesQuery = supabase
      .from('grades')
      .select(`
        id,
        score,
        points_earned,
        component_type,
        semester_id,
        created_at,
        subject_id,
        subjects (id, name, code)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })

    const { data: grades, error: gradesError } = await gradesQuery

    if (gradesError) {
      logger.error('Failed to fetch grade history', gradesError)
      return NextResponse.json(
        { error: 'Failed to fetch grade history' },
        { status: 500 }
      )
    }

    // Get semesters for time context
    const { data: semesters } = await supabase
      .from('semesters')
      .select('id, name, code, start_date, end_date')
      .order('start_date', { ascending: true })

    // Process grades into time-series data
    const gradesByMonth: Record<string, { grades: number[]; subjects: Record<string, number[]> }> = {}
    const subjectAverages: Record<string, { name: string; grades: number[] }> = {}

    grades?.forEach((grade: any) => {
      const score = grade.points_earned ?? grade.score ?? 0
      const date = new Date(grade.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Initialize month if needed
      if (!gradesByMonth[monthKey]) {
        gradesByMonth[monthKey] = { grades: [], subjects: {} }
      }
      gradesByMonth[monthKey].grades.push(score)

      // Track by subject
      const subjectId = grade.subject_id
      const subjectName = grade.subjects?.name || grade.subjects?.code || 'Chưa xác định'
      
      if (subjectId) {
        if (!gradesByMonth[monthKey].subjects[subjectId]) {
          gradesByMonth[monthKey].subjects[subjectId] = []
        }
        gradesByMonth[monthKey].subjects[subjectId].push(score)

        if (!subjectAverages[subjectId]) {
          subjectAverages[subjectId] = { name: subjectName, grades: [] }
        }
        subjectAverages[subjectId].grades.push(score)
      }
    })

    // Calculate monthly averages for trend line
    const trendData = Object.entries(gradesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const avg = data.grades.length > 0
          ? data.grades.reduce((s, g) => s + g, 0) / data.grades.length
          : 0

        // Subject breakdown for this month
        const subjectBreakdown = Object.entries(data.subjects).map(([subId, scores]) => ({
          subjectId: subId,
          average: scores.reduce((s, g) => s + g, 0) / scores.length
        }))

        return {
          month,
          label: formatMonthLabel(month),
          average: Math.round(avg * 100) / 100,
          count: data.grades.length,
          subjects: subjectBreakdown
        }
      })

    // Calculate subject averages for radar/bar chart
    const subjectData = Object.entries(subjectAverages).map(([id, data]) => ({
      subjectId: id,
      subjectName: data.name,
      average: Math.round((data.grades.reduce((s, g) => s + g, 0) / data.grades.length) * 100) / 100,
      count: data.grades.length
    })).sort((a, b) => b.average - a.average)

    // Overall statistics
    const allGrades = grades?.map((g: any) => g.points_earned ?? g.score ?? 0) || []
    const overallAverage = allGrades.length > 0
      ? allGrades.reduce((s: number, g: number) => s + g, 0) / allGrades.length
      : 0

    // Calculate improvement (compare first half to second half)
    let improvement = 0
    if (allGrades.length >= 4) {
      const mid = Math.floor(allGrades.length / 2)
      const firstHalf = allGrades.slice(0, mid)
      const secondHalf = allGrades.slice(mid)
      const firstAvg = firstHalf.reduce((s: number, g: number) => s + g, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((s: number, g: number) => s + g, 0) / secondHalf.length
      improvement = Math.round((secondAvg - firstAvg) * 100) / 100
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.full_name,
        studentCode: student.student_code,
        gradeLevel: student.grade_level
      },
      summary: {
        totalGrades: allGrades.length,
        overallAverage: Math.round(overallAverage * 100) / 100,
        improvement,
        bestSubject: subjectData[0]?.subjectName || null,
        weakestSubject: subjectData[subjectData.length - 1]?.subjectName || null
      },
      trendData,
      subjectData,
      semesters
    })

  } catch (error) {
    logger.error('Grade history API error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const months = ['', 'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']
  return `${months[parseInt(month)]} ${year}`
}
