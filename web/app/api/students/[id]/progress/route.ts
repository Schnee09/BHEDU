/**
 * Student Progress API
 * GET /api/students/[id]/progress
 * 
 * Track student academic progress over time
 * Vietnamese education system focused
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClientFromRequest(request as any)
    const { searchParams } = new URL(request.url)
    const _academicYear = searchParams.get('academic_year')

    // Get student basic info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_id,
        grade_level
      `)
      .eq('id', resolvedParams.id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get student's class enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        classes:classes!inner(
          id,
          name,
          academic_year_id,
          academic_years:academic_years!inner(
            name,
            semester
          )
        )
      `)
      .eq('student_id', resolvedParams.id)
      .order('created_at', { ascending: false })

    // Get all grades for the student
    const gradesQuery = supabase
      .from('grades')
      .select(`
        id,
        score,
        feedback,
        graded_at,
        assignment:assignments!inner(
          id,
          title,
          max_points,
          class:classes!inner(
            id,
            name,
            academic_year_id,
            academic_years:academic_years(
              name,
              semester
            )
          ),
          category:grade_categories(
            name,
            code
          )
        )
      `)
      .eq('student_id', resolvedParams.id)
      .order('graded_at', { ascending: true })

    const { data: grades } = await gradesQuery

    // Get attendance data
    const { data: attendance } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        date,
        class:classes!inner(
          academic_year_id,
          academic_years:academic_years(
            name,
            semester
          )
        )
      `)
      .eq('student_id', resolvedParams.id)

    // Process data by semester
    const semesterMap = new Map<string, any>()

    // Group grades by semester
    if (grades) {
      grades.forEach((grade: any) => {
        const assignment = grade.assignment
  if (!assignment || !assignment.class || !assignment.class.academic_years) return

  const academicYear = assignment.class.academic_years.name
        const semester = assignment.class.academic_years.semester || 'HK1'
        const key = `${academicYear}-${semester}`

        if (!semesterMap.has(key)) {
          semesterMap.set(key, {
            semester,
            academic_year: academicYear,
            subjects: new Map(),
            total_grades: [],
            attendance_records: []
          })
        }

        const semData = semesterMap.get(key)
        const subjectName = assignment.category?.name || 'Chưa phân loại'
        const subjectCode = assignment.category?.code || 'N/A'

        if (!semData.subjects.has(subjectCode)) {
          semData.subjects.set(subjectCode, {
            subject_name: subjectName,
            subject_code: subjectCode,
            grades: [],
            semester_1_grade: null,
            semester_2_grade: null,
            final_grade: null,
            credits: 1
          })
        }

        semData.subjects.get(subjectCode).grades.push(grade.score)
        semData.total_grades.push(grade.score)
      })
    }

    // Add attendance data
    if (attendance) {
      attendance.forEach((record: any) => {
  if (!record.class || !record.class.academic_years) return

  const academicYear = record.class.academic_years.name
        const semester = record.class.academic_years.semester || 'HK1'
        const key = `${academicYear}-${semester}`

        if (semesterMap.has(key)) {
          semesterMap.get(key).attendance_records.push(record.status)
        }
      })
    }

    // Calculate semester statistics
    const semesters = Array.from(semesterMap.entries()).map(([_key, data]) => {
      // Calculate subject averages
      const subjects = Array.from(data.subjects.values()).map((subject: any) => {
        const avg = subject.grades.reduce((a: number, b: number) => a + b, 0) / subject.grades.length
        
        return {
          ...subject,
          final_grade: avg,
          semester_1_grade: avg, // In real system, split by HK1/HK2
          semester_2_grade: null,
          grades: undefined // Remove raw grades from response
        }
      })

      // Calculate GPA
      const gpa = data.total_grades.length > 0
        ? data.total_grades.reduce((a: number, b: number) => a + b, 0) / data.total_grades.length
        : 0

      // Calculate attendance rate
      const totalAttendance = data.attendance_records.length
      const presentCount = data.attendance_records.filter((s: string) => s === 'present').length
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100

      // Determine conduct based on attendance and grades
      let conduct = 'Tốt'
      if (attendanceRate < 80 || gpa < 5) {
        conduct = 'Yếu'
      } else if (attendanceRate < 90 || gpa < 6.5) {
        conduct = 'Trung bình'
      } else if (gpa >= 8 && attendanceRate >= 95) {
        conduct = 'Xuất sắc'
      }

      return {
        semester: data.semester,
        academic_year: data.academic_year,
        gpa: Math.round(gpa * 100) / 100,
        conduct,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        subjects,
        rank_in_class: null, // Can be calculated if needed
        total_students: null
      }
    })

    // Sort by academic year and semester
    semesters.sort((a, b) => {
      const yearCompare = a.academic_year.localeCompare(b.academic_year)
      if (yearCompare !== 0) return yearCompare
      return a.semester.localeCompare(b.semester)
    })

    // Get current class info
    const currentClass = enrollments && enrollments.length > 0 
      ? (enrollments[0] as any).classes 
      : null

    return NextResponse.json({
      success: true,
      data: {
        student_id: student.id,
        student_name: student.full_name,
        student_code: student.student_id || 'N/A',
        class_name: currentClass?.name || 'Chưa có lớp',
        grade_level: student.grade_level || 'N/A',
        semesters
      }
    })

  } catch (error: any) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
