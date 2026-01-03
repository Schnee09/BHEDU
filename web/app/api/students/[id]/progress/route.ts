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
        enrollment_date,
        classes:classes!inner(
          id,
          name
        )
      `)
      .eq('student_id', resolvedParams.id)
      .eq('status', 'active')

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
          class_id,
          class:classes!inner(
            id,
            name
          ),
          category:assignment_categories(
            id,
            name
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
        class_id
      `)
      .eq('student_id', resolvedParams.id)

    // Process data by class (since classes don't have academic_year_id in schema)
    const classMap = new Map<string, any>()

    // Group grades by class
    if (grades) {
      grades.forEach((grade: any) => {
        const assignment = grade.assignment
        if (!assignment || !assignment.class) return

        const className = assignment.class.name
        const classId = assignment.class.id

        if (!classMap.has(classId)) {
          classMap.set(classId, {
            semester: 'HK1', // Default semester
            academic_year: '2024-2025', // Default year
            class_name: className,
            subjects: new Map(),
            total_grades: [],
            attendance_records: []
          })
        }

        const classData = classMap.get(classId)
        const subjectName = assignment.category?.name || className
        const subjectCode = assignment.category?.id || classId

        if (!classData.subjects.has(subjectCode)) {
          classData.subjects.set(subjectCode, {
            subject_name: subjectName,
            subject_code: subjectCode,
            grades: [],
            semester_1_grade: null,
            semester_2_grade: null,
            final_grade: null,
            credits: 1
          })
        }

        if (grade.score != null) {
          classData.subjects.get(subjectCode).grades.push(grade.score)
          classData.total_grades.push(grade.score)
        }
      })
    }

    // Add attendance data
    if (attendance) {
      attendance.forEach((record: any) => {
        const classId = record.class_id
        if (classMap.has(classId)) {
          classMap.get(classId).attendance_records.push(record.status)
        }
      })
    }

    // Calculate class statistics
    const semesters = Array.from(classMap.entries()).map(([_key, data]) => {
      // Calculate subject averages
      const subjects = Array.from(data.subjects.values()).map((subject: any) => {
        const avg = subject.grades.length > 0 
          ? subject.grades.reduce((a: number, b: number) => a + b, 0) / subject.grades.length
          : 0
        
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
