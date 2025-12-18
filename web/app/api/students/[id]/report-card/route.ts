/**
 * Vietnamese Report Card PDF Generator
 * POST /api/students/[id]/report-card
 *
 * Generates a Vietnamese format report card PDF
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { renderToBuffer } from '@react-pdf/renderer';
import ReportCardPDF from '@/components/reports/ReportCardPDF';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClientFromRequest(request as any);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academic_year_id');
    const semester = searchParams.get('semester') || 'HK1';

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      );
    }

    // Get student basic info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_id,
        student_code,
        date_of_birth,
        gender,
        grade_level,
        email
      `)
      .eq('id', resolvedParams.id)
      .eq('role', 'student')
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get academic year info
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', academicYearId)
      .single();

    if (yearError || !academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Get student's current class
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        classes:classes!inner(
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(
            full_name
          )
        )
      `)
      .eq('student_id', resolvedParams.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentClass = enrollment ? (enrollment as any).classes : null;

    // Get all grades for the student in this academic year and semester
    const gradesQuery = supabase
      .from('grades')
      .select(`
        id,
        points_earned,
        component_type,
        graded_at,
        assignment:assignments!inner(
          id,
          title,
          class_id,
          subject:subjects!assignments_subject_id_fkey(
            name,
            code
          ),
          category:grade_categories!inner(
            name,
            code
          )
        )
      `)
      .eq('student_id', resolvedParams.id)
      .eq('academic_year_id', academicYearId);

    // Add semester filter if not "CN" (whole year)
    if (semester !== 'CN') {
      gradesQuery.eq('semester', semester);
    }

    const { data: grades, error: gradesError } = await gradesQuery;

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      );
    }

    // Process grades by subject
    const subjectMap = new Map();

    grades?.forEach((grade: any) => {
      const subjectCode = grade.assignment.subject.code;
      const subjectName = grade.assignment.subject.name;
      const componentType = grade.component_type;

      if (!subjectMap.has(subjectCode)) {
        subjectMap.set(subjectCode, {
          subject_code: subjectCode,
          subject_name: subjectName,
          credits: 1, // Default credits
          component_grades: {
            oral: [],
            fifteen_min: [],
            one_period: [],
            midterm: [],
            final: [],
          },
        });
      }

      const subject = subjectMap.get(subjectCode);

      if (componentType === 'oral' || componentType === 'mieng') {
        subject.component_grades.oral.push(grade.points_earned);
      } else if (componentType === 'fifteen_min' || componentType === '15_phut') {
        subject.component_grades.fifteen_min.push(grade.points_earned);
      } else if (componentType === 'one_period' || componentType === '1_tiet') {
        subject.component_grades.one_period.push(grade.points_earned);
      } else if (componentType === 'midterm' || componentType === 'giua_ky') {
        subject.component_grades.midterm.push(grade.points_earned);
      } else if (componentType === 'final' || componentType === 'cuoi_ky') {
        subject.component_grades.final.push(grade.points_earned);
      }
    });

    // Calculate averages for each subject
    const subjects = Array.from(subjectMap.values()).map((subject) => {
      const calculateAverage = (grades: number[]) => {
        if (grades.length === 0) return null;
        return grades.reduce((a, b) => a + b, 0) / grades.length;
      };

      // Calculate weighted average (Vietnamese system)
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

      const finalGrade = totalWeight > 0 ? totalWeighted / totalWeight : 0;

      return {
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        final_grade: Math.round(finalGrade * 100) / 100,
        grade_letter: getVietnameseGradeLetter(finalGrade),
        grade_description: getGradeDescription(finalGrade),
        component_grades: {
          oral: oralAvg ? Math.round(oralAvg * 100) / 100 : null,
          fifteen_min: fifteenMinAvg ? Math.round(fifteenMinAvg * 100) / 100 : null,
          one_period: onePeriodAvg ? Math.round(onePeriodAvg * 100) / 100 : null,
          midterm: midtermAvg ? Math.round(midtermAvg * 100) / 100 : null,
          final: finalAvg ? Math.round(finalAvg * 100) / 100 : null,
        },
      };
    });

    // Calculate GPA
    const gpa = subjects.length > 0
      ? subjects.reduce((sum, s) => sum + s.final_grade, 0) / subjects.length
      : 0;

    // Get conduct grade
    const conductQuery = supabase
      .from('conduct_grades')
      .select('*')
      .eq('student_id', resolvedParams.id)
      .eq('academic_year_id', academicYearId);

    if (semester !== 'CN') {
      conductQuery.eq('semester', semester);
    }

    const { data: conductGrades } = await conductQuery;

    // Determine conduct
    let conduct = 'Tốt';
    if (conductGrades && conductGrades.length > 0) {
      conduct = conductGrades[0].conduct_grade || 'Tốt';
    }

    // Get Vietnamese academic classification
    const classification = getVietnameseClassification(Math.round(gpa * 100) / 100, conduct);

    // Prepare report card data
    const reportCardData = {
      school_name: 'TRƯỜNG TRUNG HỌC PHỔ THÔNG BẮC HÀ',
      school_address: 'Lào Cai, Việt Nam',
      student_name: student.full_name,
      student_code: student.student_code || student.student_id || 'N/A',
      date_of_birth: formatDate(student.date_of_birth),
      gender: student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác',
      class_name: currentClass?.name || 'Chưa có lớp',
      grade_level: student.grade_level || 'N/A',
      academic_year: academicYear.name,
      semester: semester === 'CN' ? 'Cả năm' : semester === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2',
      subjects: subjects.sort((a, b) => a.subject_name.localeCompare(b.subject_name)),
      gpa: Math.round(gpa * 100) / 100,
      conduct,
      academic_classification: classification,
      teacher_comment: conductGrades && conductGrades.length > 0 ? conductGrades[0].teacher_comment : null,
      homeroom_teacher: currentClass?.teacher?.full_name || null,
      principal_name: 'Hiệu trưởng',
      report_date: formatDate(new Date().toISOString()),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(ReportCardPDF({ data: reportCardData }) as any);

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-card-${student.student_code || student.student_id}-${semester}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating report card PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function getVietnameseClassification(gpa: number, conduct: string): {
  classification: string;
  classification_vi: string;
  description: string;
} {
  if (gpa >= 9.0 && conduct === 'Xuất sắc') {
    return {
      classification: 'Excellent',
      classification_vi: 'Xuất sắc',
      description: 'Outstanding academic performance with excellent conduct'
    };
  } else if (gpa >= 8.0 && conduct !== 'Yếu') {
    return {
      classification: 'Good',
      classification_vi: 'Giỏi',
      description: 'Strong academic performance with good conduct'
    };
  } else if (gpa >= 6.5 && conduct !== 'Yếu') {
    return {
      classification: 'Fair',
      classification_vi: 'Khá',
      description: 'Satisfactory academic performance'
    };
  } else if (gpa >= 5.0) {
    return {
      classification: 'Average',
      classification_vi: 'Trung bình',
      description: 'Average academic performance, needs improvement'
    };
  } else {
    return {
      classification: 'Weak',
      classification_vi: 'Yếu',
      description: 'Below average performance, significant improvement needed'
    };
  }
}

function getVietnameseGradeLetter(numericGrade: number): string {
  if (numericGrade >= 9.5) return 'A+';
  if (numericGrade >= 8.5) return 'A';
  if (numericGrade >= 7.0) return 'B+';
  if (numericGrade >= 5.0) return 'B';
  return 'C';
}

function getGradeDescription(numericGrade: number): string {
  if (numericGrade >= 9.5) return 'Xuất sắc';
  if (numericGrade >= 8.5) return 'Giỏi';
  if (numericGrade >= 7.0) return 'Khá';
  if (numericGrade >= 5.0) return 'Trung bình';
  return 'Yếu';
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}