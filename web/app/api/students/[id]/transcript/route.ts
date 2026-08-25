/**
 * Student Transcript API
 * GET /api/students/[id]/transcript
 *
 * Fetches consolidated student grade data for Vietnamese Học bạ (transcript) generation
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { VIETNAMESE_LOCALE } from '@/lib/utils/vietnamese';

// Vietnamese Academic Classification Function
function getVietnameseClassification(
  gpa: number,
  conduct: string
): {
  classification: string;
  classification_vi: string;
  description: string;
} {
  if (gpa >= 9.0 && conduct === 'Xuất sắc') {
    return {
      classification: 'Excellent',
      classification_vi: 'Xuất sắc',
      description: 'Outstanding academic performance with excellent conduct',
    };
  } else if (gpa >= 8.0 && conduct !== 'Yếu') {
    return {
      classification: 'Good',
      classification_vi: 'Giỏi',
      description: 'Strong academic performance with good conduct',
    };
  } else if (gpa >= 6.5 && conduct !== 'Yếu') {
    return {
      classification: 'Fair',
      classification_vi: 'Khá',
      description: 'Satisfactory academic performance',
    };
  } else if (gpa >= 5.0) {
    return {
      classification: 'Average',
      classification_vi: 'Trung bình',
      description: 'Average academic performance, needs improvement',
    };
  } else {
    return {
      classification: 'Weak',
      classification_vi: 'Yếu',
      description: 'Below average performance, significant improvement needed',
    };
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const studentIdRequesting = resolvedParams.id;

    // Flexible auth: allow students (self), parents (linked), and teachers/admins
    const authResult = await teacherAuth(request);

    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const { userId, userRole } = authResult;
    const supabase = createClientFromRequest(request as any);

    // Role scoping
    let hasAccess = false;
    if (['super_admin', 'owner', 'admin', 'staff', 'teacher'].includes(userRole || '')) {
      hasAccess = true;
    } else if (userRole === 'student') {
      hasAccess = userId === studentIdRequesting;
    } else if (userRole === 'parent') {
      const { data: link } = await supabase
        .from('parent_student_links')
        .select('id')
        .eq('parent_id', userId)
        .eq('student_id', studentIdRequesting)
        .eq('status', 'approved')
        .single();

      hasAccess = !!link;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this transcript' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academic_year_id');
    const semester = searchParams.get('semester') || 'HK1';

    // 1. Get student profile info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, student_id, student_code, date_of_birth, gender, grade_level, email')
      .eq('id', resolvedParams.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 2. Get academic year info
    let academicYear: { id: string; name: string } | null = null;
    if (academicYearId) {
      const { data: yr } = await supabase
        .from('academic_years')
        .select('id, name')
        .eq('id', academicYearId)
        .single();
      academicYear = yr;
    }

    if (!academicYear) {
      const { data: latestYr } = await supabase
        .from('academic_years')
        .select('id, name')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      academicYear = latestYr || { id: 'default', name: 'Năm học hiện tại' };
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
      .eq('student_id', resolvedParams.id)
      .eq('status', 'enrolled')
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
      .eq('student_id', resolvedParams.id);

    if (academicYearId && academicYearId !== 'all') {
      gradesQuery = gradesQuery.eq('academic_year_id', academicYearId);
    }

    if (semester && semester !== 'CN') {
      gradesQuery = gradesQuery.eq('semester', semester);
    }

    const { data: grades, error: gradesError } = await gradesQuery;

    if (gradesError) {
      console.error('Error fetching grades in transcript:', gradesError);
    }

    // 5. Get conduct grade
    let conductQuery = supabase
      .from('conduct_grades')
      .select('*')
      .eq('student_id', resolvedParams.id);

    if (academicYearId && academicYearId !== 'all') {
      conductQuery = conductQuery.eq('academic_year_id', academicYearId);
    }

    if (semester !== 'CN') {
      conductQuery = conductQuery.eq('semester', semester);
    }

    const { data: conductGrades } = await conductQuery;

    // 6. Get attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, status, date')
      .eq('student_id', resolvedParams.id);

    // 7. Process grades by subject and component type
    const subjectMap = new Map<string, any>();

    if (grades && grades.length > 0) {
      grades.forEach((grade: any) => {
        const subjectObj = grade.subject || { name: 'Môn học', code: 'GENERAL' };
        const subjectName = subjectObj.name || 'Môn học';
        const subjectCode = subjectObj.code || subjectObj.id || 'GEN';
        const componentType = (grade.component_type || '').toLowerCase();
        const scoreVal = grade.score ?? grade.points_earned ?? 0;

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
        semester_1_grade: semester === 'HK1' ? finalGrade : null,
        semester_2_grade: semester === 'HK2' ? finalGrade : null,
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
    let conduct = 'Tốt';
    if (conductGrades && conductGrades.length > 0) {
      conduct = conductGrades[0].conduct_grade || 'Tốt';
    } else {
      if (attendanceRate < 80 || (gpa > 0 && gpa < 5)) {
        conduct = 'Yếu';
      } else if (attendanceRate < 90 || (gpa > 0 && gpa < 6.5)) {
        conduct = 'Trung bình';
      } else if (gpa >= 8 && attendanceRate >= 95) {
        conduct = 'Xuất sắc';
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
      semester: semester === 'CN' ? 'Cả năm' : semester === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2',
      subjects: subjects.sort((a: any, b: any) => a.subject_name.localeCompare(b.subject_name)),
      gpa: gpa > 0 ? gpa.toFixed(1) : '—',
      conduct,
      attendance_rate: attendanceRate,
      academic_classification: classification,
      teacher_comment:
        conductGrades && conductGrades.length > 0 ? conductGrades[0].teacher_comment : null,
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
