/**
 * Student Transcript API
 * GET /api/students/[id]/transcript
 *
 * Fetches consolidated student grade data for Vietnamese Học bạ (transcript) generation
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { getNormalizedGradeScore } from '@/lib/grades/normalizedScore';
import { getVietnameseClassification, normalizeConductRating } from '@/lib/grades/conduct';
import { getGradeSemesterAliases, normalizeGradeSemester } from '@/lib/grades/semester';
import { VIETNAMESE_LOCALE } from '@/lib/utils/vietnamese';
import { settingsService } from '@/lib/services/settingsService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;

    const auth = await getAuthContext(request);
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClientFromRequest(request as any);

    const { searchParams } = new URL(request.url);
    const identifier = resolvedParams.id;
    const academicYearId = searchParams.get('academic_year_id');
    const paramSemester = searchParams.get('semester');

    // 1. Get student profile info with flexible lookup
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

    let studentQuery = supabase
      .from('profiles')
      .select(
        'id, full_name, student_id, student_code, date_of_birth, gender, grade_level, email, role'
      )
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
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this transcript' },
        { status: 403 }
      );
    }

    // 2. Get active academic context
    const { academicYear: currentAY, semester: activeSem } =
      await settingsService.getAcademicContext();
    const semester = paramSemester || activeSem.code || 'HK1';
    const canonicalSemester = normalizeGradeSemester(semester);
    const isWholeYear = canonicalSemester === 'final';

    let academicYear: { id: string; name: string } | null = null;
    if (academicYearId) {
      const { data: yr } = await supabase
        .from('academic_years')
        .select('id, name')
        .eq('id', academicYearId)
        .maybeSingle();
      academicYear = yr;
    }

    if (!academicYear) {
      academicYear = { id: currentAY.id, name: currentAY.name };
    }

    // 3. Get student's class
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(
        `
        class_id,
        classes:classes(
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(
            full_name
          )
        )
      `
      )
      .eq('student_id', realStudentId)
      .in('status', ['enrolled', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentClass = enrollment ? (enrollment as any).classes : null;

    // 4. Get all grades for the student
    let gradesQuery = supabase
      .from('grades')
      .select(
        `
        id,
        score,
        points_earned,
        component_type,
        semester,
        academic_year_id,
        created_at,
        subject:subjects(id, name, code)
      `
      )
      .eq('student_id', realStudentId)
      .is('deleted_at', null);

    if (academicYearId && academicYearId !== 'all') {
      gradesQuery = gradesQuery.eq('academic_year_id', academicYearId);
    }

    if (!isWholeYear) {
      gradesQuery = gradesQuery.in('semester', getGradeSemesterAliases(semester));
    }

    const { data: grades, error: gradesError } = await gradesQuery;

    if (gradesError) {
      console.error('Error fetching grades in transcript:', gradesError);
    }

    // 5. Get conduct grade
    let conductQuery = supabase.from('conduct_grades').select('*').eq('student_id', realStudentId);

    if (academicYearId && academicYearId !== 'all') {
      conductQuery = conductQuery.eq('academic_year_id', academicYearId);
    }

    if (!isWholeYear) {
      conductQuery = conductQuery.in('semester', getGradeSemesterAliases(semester));
    }

    const { data: conductGrades } = await conductQuery;

    // 6. Get attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, status, date')
      .eq('student_id', realStudentId);

    // 7. Process grades by subject and component type
    const subjectMap = new Map<string, any>();

    if (grades && grades.length > 0) {
      grades.forEach((grade: any) => {
        const subjectObj = grade.subject || { name: 'Môn học', code: 'GENERAL' };
        const subjectName = subjectObj.name || 'Môn học';
        const subjectCode = subjectObj.code || subjectObj.id || 'GEN';
        const componentType = (grade.component_type || '').toLowerCase();
        const scoreVal = getNormalizedGradeScore(grade);

        if (scoreVal === null) return;

        if (!subjectMap.has(subjectCode)) {
          subjectMap.set(subjectCode, {
            subject_name: subjectName,
            subject_code: subjectCode,
            credits: 1,
            component_grades: {
              oral: [] as number[],
              fifteen_min: [] as number[],
              one_period: [] as number[],
              midterm: [] as number[],
              final: [] as number[],
            },
            all_grades: [] as number[],
          });
        }

        const subject = subjectMap.get(subjectCode);
        subject.all_grades.push(scoreVal);

        // Group by component type
        if (componentType === 'oral' || componentType.includes('mieng')) {
          subject.component_grades.oral.push(scoreVal);
        } else if (componentType === 'fifteen_min' || componentType.includes('15')) {
          subject.component_grades.fifteen_min.push(scoreVal);
        } else if (
          componentType === 'one_period' ||
          componentType.includes('1_tiet') ||
          componentType.includes('tiet')
        ) {
          subject.component_grades.one_period.push(scoreVal);
        } else if (componentType === 'midterm' || componentType.includes('giua')) {
          subject.component_grades.midterm.push(scoreVal);
        } else if (componentType === 'final' || componentType.includes('cuoi')) {
          subject.component_grades.final.push(scoreVal);
        } else {
          // Default fallback
          subject.component_grades.fifteen_min.push(scoreVal);
        }
      });
    }

    // Calculate averages for each subject
    const subjects = Array.from(subjectMap.values()).map((subject) => {
      const calculateAverage = (scores: number[]) => {
        if (scores.length === 0) return null;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      };

      const oralAvg = calculateAverage(subject.component_grades.oral);
      const fifteenMinAvg = calculateAverage(subject.component_grades.fifteen_min);
      const onePeriodAvg = calculateAverage(subject.component_grades.one_period);
      const midtermAvg = calculateAverage(subject.component_grades.midterm);
      const finalAvg = calculateAverage(subject.component_grades.final);

      // Weighted formula: (Miệng*1 + 15phút*1 + 1tiết*2 + Giữa kỳ*2 + Cuối kỳ*3) / total_weight
      let totalWeighted = 0;
      let totalWeight = 0;

      if (oralAvg !== null) {
        totalWeighted += oralAvg * 1;
        totalWeight += 1;
      }
      if (fifteenMinAvg !== null) {
        totalWeighted += fifteenMinAvg * 1;
        totalWeight += 1;
      }
      if (onePeriodAvg !== null) {
        totalWeighted += onePeriodAvg * 2;
        totalWeight += 2;
      }
      if (midtermAvg !== null) {
        totalWeighted += midtermAvg * 2;
        totalWeight += 2;
      }
      if (finalAvg !== null) {
        totalWeighted += finalAvg * 3;
        totalWeight += 3;
      }

      const finalGrade = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 10) / 10 : 0;

      return {
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        semester_1_grade: canonicalSemester === '1' ? finalGrade : null,
        semester_2_grade: canonicalSemester === '2' ? finalGrade : null,
        final_grade: finalGrade,
        credits: subject.credits,
        component_grades: {
          oral: oralAvg !== null ? Math.round(oralAvg * 10) / 10 : null,
          fifteen_min: fifteenMinAvg !== null ? Math.round(fifteenMinAvg * 10) / 10 : null,
          one_period: onePeriodAvg !== null ? Math.round(onePeriodAvg * 10) / 10 : null,
          midterm: midtermAvg !== null ? Math.round(midtermAvg * 10) / 10 : null,
          final: finalAvg !== null ? Math.round(finalAvg * 10) / 10 : null,
        },
      };
    });

    // Calculate GPA
    const gpa =
      subjects.length > 0
        ? Math.round((subjects.reduce((sum, s) => sum + s.final_grade, 0) / subjects.length) * 10) /
          10
        : 0;

    // Calculate attendance rate
    let attendanceRate = 100;
    if (attendance && attendance.length > 0) {
      const presentCount = attendance.filter(
        (a: any) => a.status === 'present' || a.status === 'late'
      ).length;
      attendanceRate = Math.round((presentCount / attendance.length) * 100);
    }

    // Determine conduct
    let conduct = normalizeConductRating(conductGrades?.[0]?.conduct_grade);
    if (!conductGrades || conductGrades.length === 0) {
      if (attendanceRate < 80 || (gpa > 0 && gpa < 5)) {
        conduct = 'Chưa đạt';
      } else if (attendanceRate < 90 || (gpa > 0 && gpa < 6.5)) {
        conduct = 'Đạt';
      } else if (gpa >= 8 && attendanceRate >= 95) {
        conduct = 'Tốt';
      }
    }

    // Get Vietnamese academic classification
    const classification = getVietnameseClassification(gpa, conduct);

    const formatDate = (dateString?: string | null) => {
      if (!dateString) return '—';
      try {
        return VIETNAMESE_LOCALE.formatDate(dateString);
      } catch {
        return new Date(dateString).toLocaleDateString('vi-VN');
      }
    };

    // Prepare transcript response
    const transcriptData = {
      school_name: 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG',
      school_address: 'Lào Cai, Việt Nam',
      student_name: student.full_name,
      student_code: student.student_code || student.student_id || 'N/A',
      date_of_birth: formatDate(student.date_of_birth),
      gender: student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác',
      class_name: currentClass?.name || 'Chưa có lớp',
      grade_level: student.grade_level || 'N/A',
      academic_year: academicYear.name,
      semester:
        canonicalSemester === 'final'
          ? 'Cả năm'
          : canonicalSemester === '1'
            ? 'Học kỳ 1'
            : 'Học kỳ 2',
      subjects: subjects.sort((a: any, b: any) => a.subject_name.localeCompare(b.subject_name)),
      gpa: gpa > 0 ? gpa.toFixed(1) : '—',
      conduct,
      attendance_rate: attendanceRate,
      academic_classification: classification,
      teacher_comment: conductGrades?.[0]?.comments || null,
      homeroom_teacher: currentClass?.teacher?.full_name || null,
      principal_name: 'Hiệu trưởng',
      report_date: formatDate(new Date().toISOString()),
    };

    return NextResponse.json({
      success: true,
      data: transcriptData,
    });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
