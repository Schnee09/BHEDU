/**
 * Student Progress API
 * GET /api/students/[id]/progress
 *
 * Track student academic progress over time
 * Vietnamese education system focused
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { settingsService } from '@/lib/services/settingsService';
import { getNormalizedGradeScore } from '@/lib/grades/normalizedScore';
import { normalizeGradeSemester } from '@/lib/grades/semester';
import { normalizeConductRating } from '@/lib/grades/conduct';
import { calculateComponentAverage, normalizeGradeComponent } from '@/lib/grades/component';
import { calculateAttendanceRate } from '@/lib/attendance/rate';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;

    const auth = await getAuthContext(request);
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
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

    const allowed = await canAccessStudent(
      createServiceClient(),
      { id: auth.profile.id, role: auth.role },
      realStudentId
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parallelize data fetching using resolved realStudentId
    const [
      enrollmentsResponse,
      gradesResponse,
      attendanceResponse,
      academicYearsResponse,
      conductResponse,
      semestersResponse,
    ] = await Promise.all([
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
        .eq('status', 'enrolled'),

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
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),

      supabase
        .from('attendance')
        .select('id, status, date, class_id')
        .eq('student_id', realStudentId)
        .is('deleted_at', null),

      supabase.from('academic_years').select('id, name'),

      supabase
        .from('conduct_grades')
        .select('academic_year_id, semester, conduct_grade')
        .eq('student_id', realStudentId),

      supabase.from('semesters').select('code, start_date, end_date'),
    ]);

    const enrollments = enrollmentsResponse.data || [];
    const grades = gradesResponse.data || [];
    const attendance = attendanceResponse.data || [];
    const academicYears = academicYearsResponse.data || [];
    const conductGrades = conductResponse.data || [];
    const semesterPeriods = semestersResponse.data || [];

    // Load active academic context (Year & Semester)
    const { academicYear: currentAY, semester: activeSem } =
      await settingsService.getAcademicContext();
    const activeYearName = currentAY.name || '2026-2027';
    const activeSemester = normalizeGradeSemester(activeSem.code || activeSem.name) || '1';
    const academicYearNames = new Map(
      academicYears.map((year: any) => [year.id, year.name] as const)
    );
    const conductByPeriod = new Map<string, ReturnType<typeof normalizeConductRating>>();
    for (const conductGrade of conductGrades as any[]) {
      const semester = normalizeGradeSemester(conductGrade.semester);
      if (semester) {
        conductByPeriod.set(
          `${conductGrade.academic_year_id}-${semester}`,
          normalizeConductRating(conductGrade.conduct_grade)
        );
      }
    }

    // Process data by class / semester
    const classMap = new Map<string, any>();

    // Group grades by class / semester
    if (grades && grades.length > 0) {
      grades.forEach((grade: any) => {
        const className = grade.class?.name || (enrollments[0] as any)?.classes?.name || 'Lớp học';
        const classId = grade.class_id || 'default';
        const semester = normalizeGradeSemester(grade.semester) || activeSemester;
        const academicYearId = grade.academic_year_id || currentAY.id || 'unknown';
        const academicYearName = academicYearNames.get(academicYearId) || activeYearName;
        const key = `${academicYearId}-${classId}-${semester}`;

        if (!classMap.has(key)) {
          classMap.set(key, {
            semester: semester === 'final' ? 'Cả năm' : `Học kỳ ${semester}`,
            semester_code: semester,
            academic_year_id: academicYearId,
            academic_year: academicYearName,
            class_id: classId,
            class_name: className,
            subjects: new Map(),
            attendance_records: [] as string[],
          });
        }

        const classData = classMap.get(key);
        const subjectObj = grade.subject || { name: 'Môn học', code: 'GEN' };
        const subjectName = subjectObj.name || 'Môn học';
        const subjectCode = subjectObj.code || subjectObj.id || 'GEN';
        const scoreVal = getNormalizedGradeScore(grade);
        const componentType = normalizeGradeComponent(grade.component_type);

        if (scoreVal === null || !componentType) return;

        if (!classData.subjects.has(subjectCode)) {
          classData.subjects.set(subjectCode, {
            subject_name: subjectName,
            subject_code: subjectCode,
            component_grades: {
              oral: [] as number[],
              fifteen_min: [] as number[],
              one_period: [] as number[],
              midterm: [] as number[],
              final: [] as number[],
            },
            semester_1_grade: null,
            semester_2_grade: null,
            final_grade: null,
            credits: 1,
          });
        }

        classData.subjects.get(subjectCode).component_grades[componentType].push(scoreVal);
      });
    }

    // Add attendance data
    if (attendance && attendance.length > 0) {
      for (const data of classMap.values()) {
        const period = semesterPeriods.find(
          (candidate: any) =>
            normalizeGradeSemester(candidate.code) === data.semester_code &&
            candidate.code?.includes(data.academic_year)
        );

        for (const record of attendance as any[]) {
          const matchesClass = data.class_id === 'default' || record.class_id === data.class_id;
          const matchesPeriod =
            !period ||
            (record.date && record.date >= period.start_date && record.date <= period.end_date);
          if (matchesClass && matchesPeriod) {
            data.attendance_records.push(record.status);
          }
        }
      }
    }

    // If no grades yet, create an empty semester representation using active context
    if (classMap.size === 0) {
      const className = (enrollments[0] as any)?.classes?.name || 'Chưa xếp lớp';
      classMap.set(`default-${activeSemester}`, {
        semester: activeSemester === 'final' ? 'Cả năm' : `Học kỳ ${activeSemester}`,
        semester_code: activeSemester,
        academic_year_id: currentAY.id,
        academic_year: activeYearName,
        class_name: className,
        class_id: (enrollments[0] as any)?.class_id || 'default',
        subjects: new Map(),
        attendance_records: attendance.map((a: any) => a.status),
      });
    }

    // Calculate class statistics
    const semesters = Array.from(classMap.values()).map((data) => {
      const subjects = Array.from(data.subjects.values()).map((subject: any) => {
        const average = (scores: number[]) =>
          scores.length > 0
            ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
            : null;
        const componentAverage = calculateComponentAverage({
          oral: average(subject.component_grades.oral),
          fifteen_min: average(subject.component_grades.fifteen_min),
          one_period: average(subject.component_grades.one_period),
          midterm: average(subject.component_grades.midterm),
          final: average(subject.component_grades.final),
        });
        const avg = componentAverage !== null ? Math.round(componentAverage * 10) / 10 : null;

        return {
          ...subject,
          final_grade: avg,
          semester_1_grade: data.semester_code === '1' ? avg : null,
          semester_2_grade: data.semester_code === '2' ? avg : null,
          component_grades: undefined,
        };
      });

      const gpa =
        subjects.length > 0
          ? Math.round(
              (subjects.reduce((sum: number, subject: any) => sum + subject.final_grade, 0) /
                subjects.length) *
                10
            ) / 10
          : null;

      const attendanceRate = calculateAttendanceRate(data.attendance_records);

      return {
        semester: data.semester,
        academic_year: data.academic_year,
        gpa,
        conduct:
          conductByPeriod.get(`${data.academic_year_id}-${data.semester_code}`) ?? 'Chưa đánh giá',
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
