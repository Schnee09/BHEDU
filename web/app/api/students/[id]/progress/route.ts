/**
 * Student Progress API
 * GET /api/students/[id]/progress
 *
 * Track student academic progress over time
 * Vietnamese education system focused
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { settingsService } from '@/lib/services/settingsService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;

    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClientFromRequest(request as any);

    // 1. Get student profile with flexible identifier lookup (UUID or student_code or student_id or phone)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

    let studentQuery = supabase
      .from('profiles')
      .select('id, full_name, student_id, student_code, grade_level, role')
      .eq('role', 'student');

    if (isUUID) {
      studentQuery = studentQuery.eq('id', identifier);
    } else {
      studentQuery = studentQuery.or(
        `student_code.ilike.${identifier},student_id.ilike.${identifier},phone.eq.${identifier}`
      );
    }

    const { data: student, error: studentError } = await studentQuery.maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const realStudentId = student.id;

    // 2. Parallelize data fetching using resolved realStudentId
    const [enrollmentsResponse, gradesResponse, attendanceResponse] = await Promise.all([
      supabase
        .from('enrollments')
        .select(
          `
            class_id,
            enrollment_date,
            status,
            classes:classes(
              id,
              name
            )
          `
        )
        .eq('student_id', realStudentId)
        .in('status', ['enrolled', 'active']),

      supabase
        .from('grades')
        .select(
          `
            id,
            score,
            points_earned,
            component_type,
            semester,
            academic_year_id,
            class_id,
            created_at,
            subject:subjects(id, name, code),
            class:classes(id, name)
          `
        )
        .eq('student_id', realStudentId)
        .order('created_at', { ascending: true }),

      supabase
        .from('attendance')
        .select('id, status, date, class_id')
        .eq('student_id', realStudentId),
    ]);

    const enrollments = enrollmentsResponse.data || [];
    const grades = gradesResponse.data || [];
    const attendance = attendanceResponse.data || [];

    // Load active academic context (Year & Semester)
    const { academicYear: currentAY, semester: activeSem } =
      await settingsService.getAcademicContext();
    const activeYearName = currentAY.name || '2026-2027';
    const activeSemName = activeSem.name || activeSem.code || 'HK1';

    // Process data by class / semester
    const classMap = new Map<string, any>();

    // Group grades by class / semester
    if (grades && grades.length > 0) {
      grades.forEach((grade: any) => {
        const className = grade.class?.name || (enrollments[0] as any)?.classes?.name || 'Lớp học';
        const classId = grade.class_id || 'default';
        const semester = grade.semester || activeSemName;
        const key = `${classId}-${semester}`;

        if (!classMap.has(key)) {
          classMap.set(key, {
            semester,
            academic_year: activeYearName,
            class_name: className,
            subjects: new Map(),
            total_grades: [] as number[],
            attendance_records: [] as string[],
          });
        }

        const classData = classMap.get(key);
        const subjectObj = grade.subject || { name: 'Môn học', code: 'GEN' };
        const subjectName = subjectObj.name || 'Môn học';
        const subjectCode = subjectObj.code || subjectObj.id || 'GEN';
        const scoreVal = grade.score ?? grade.points_earned;

        if (!classData.subjects.has(subjectCode)) {
          classData.subjects.set(subjectCode, {
            subject_name: subjectName,
            subject_code: subjectCode,
            grades: [] as number[],
            semester_1_grade: null,
            semester_2_grade: null,
            final_grade: null,
            credits: 1,
          });
        }

        if (scoreVal != null) {
          const numScore = Number(scoreVal);
          if (!isNaN(numScore)) {
            classData.subjects.get(subjectCode).grades.push(numScore);
            classData.total_grades.push(numScore);
          }
        }
      });
    }

    // Add attendance data
    if (attendance && attendance.length > 0) {
      attendance.forEach((record: any) => {
        for (const data of classMap.values()) {
          data.attendance_records.push(record.status);
        }
      });
    }

    // If no grades yet, create an empty semester representation using active context
    if (classMap.size === 0) {
      const className = (enrollments[0] as any)?.classes?.name || 'Chưa xếp lớp';
      classMap.set(`default-${activeSemName}`, {
        semester: activeSemName,
        academic_year: activeYearName,
        class_name: className,
        subjects: new Map(),
        total_grades: [],
        attendance_records: attendance.map((a: any) => a.status),
      });
    }

    // Calculate class statistics
    const semesters = Array.from(classMap.entries()).map(([_key, data]) => {
      const subjects = Array.from(data.subjects.values()).map((subject: any) => {
        const avg =
          subject.grades.length > 0
            ? Math.round(
                (subject.grades.reduce((a: number, b: number) => a + b, 0) /
                  subject.grades.length) *
                  10
              ) / 10
            : 0;

        return {
          ...subject,
          final_grade: avg,
          semester_1_grade: avg,
          semester_2_grade: null,
          grades: undefined,
        };
      });

      const gpa =
        data.total_grades.length > 0
          ? Math.round(
              (data.total_grades.reduce((a: number, b: number) => a + b, 0) /
                data.total_grades.length) *
                10
            ) / 10
          : null;

      const totalAttendance = data.attendance_records.length;
      const presentCount = data.attendance_records.filter(
        (s: string) => s === 'present' || s === 'late'
      ).length;
      const attendanceRate =
        totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

      let conduct = 'Tốt';
      if (attendanceRate < 80 || (gpa !== null && gpa < 5)) {
        conduct = 'Yếu';
      } else if (attendanceRate < 90 || (gpa !== null && gpa < 6.5)) {
        conduct = 'Trung bình';
      } else if (gpa !== null && gpa >= 8 && attendanceRate >= 95) {
        conduct = 'Xuất sắc';
      }

      return {
        semester: data.semester,
        academic_year: data.academic_year,
        gpa,
        conduct,
        attendance_rate: attendanceRate,
        subjects,
        rank_in_class: null,
        total_students: null,
      };
    });

    const currentClass =
      enrollments && enrollments.length > 0 ? (enrollments[0] as any).classes : null;

    return NextResponse.json({
      success: true,
      data: {
        student_uu_id: student.id,
        student_name: student.full_name,
        student_code: student.student_code || '—',
        student_id: student.student_id || '—',
        class_name: currentClass?.name || 'Chưa có lớp',
        grade_level: student.grade_level || '—',
        semesters,
      },
    });
  } catch (error: any) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
