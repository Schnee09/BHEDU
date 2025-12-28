// @ts-nocheck
/**
 * Report Card API Endpoint
 * 
 * Generates report card data for a specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateSubjectAverage, getLetterGradeFromScore, getAcademicStanding } from '@/lib/grades/gpaCalculator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Fetch student info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, student_id, date_of_birth, gender, email')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch student's enrollment for class info
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('class:class_id(id, name)')
      .eq('student_id', studentId)
      .single();

    // Fetch grades for the student
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id,
        score,
        evaluation_type,
        subject:subject_id(id, name),
        created_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Group grades by subject
    const subjectGrades = new Map<string, {
      name: string;
      oral?: number;
      fifteenMin?: number;
      fortyFiveMin?: number;
      midterm?: number;
      final?: number;
    }>();

    for (const grade of grades || []) {
      const subjectId = grade.subject?.id;
      const subjectName = grade.subject?.name || 'Unknown';
      
      if (!subjectId) continue;

      if (!subjectGrades.has(subjectId)) {
        subjectGrades.set(subjectId, { name: subjectName });
      }

      const subject = subjectGrades.get(subjectId)!;
      const evalType = grade.evaluation_type?.toLowerCase() || '';
      
      if (evalType.includes('oral') || evalType.includes('miệng')) {
        subject.oral = grade.score;
      } else if (evalType.includes('15') || evalType.includes('kiểm tra 15')) {
        subject.fifteenMin = grade.score;
      } else if (evalType.includes('45') || evalType.includes('1 tiết')) {
        subject.fortyFiveMin = grade.score;
      } else if (evalType.includes('midterm') || evalType.includes('giữa kỳ')) {
        subject.midterm = grade.score;
      } else if (evalType.includes('final') || evalType.includes('cuối kỳ')) {
        subject.final = grade.score;
      }
    }

    // Calculate averages and build subject list
    const subjects = Array.from(subjectGrades.entries()).map(([id, data]) => {
      const gradeData = {
        subjectId: id,
        subjectName: data.name,
        credits: 1,
        oralScore: data.oral,
        fifteenMinScore: data.fifteenMin,
        fortyFiveMinScore: data.fortyFiveMin,
        midtermScore: data.midterm,
        finalScore: data.final,
      };
      
      const avg = calculateSubjectAverage(gradeData);
      
      return {
        name: data.name,
        oralScore: data.oral,
        fifteenMinScore: data.fifteenMin,
        fortyFiveMinScore: data.fortyFiveMin,
        midtermScore: data.midterm,
        finalScore: data.final,
        averageScore: avg || 0,
        letterGrade: avg ? getLetterGradeFromScore(avg) : 'N/A',
      };
    });

    // Calculate overall GPA
    const validSubjects = subjects.filter(s => s.averageScore > 0);
    const semesterGPA = validSubjects.length > 0
      ? validSubjects.reduce((sum, s) => sum + s.averageScore, 0) / validSubjects.length
      : 0;

    // Fetch attendance rate
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    const totalDays = attendance?.length || 0;
    const presentDays = attendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // Build response
    const reportCardData = {
      studentName: student.full_name,
      studentCode: student.student_id || '',
      className: enrollment?.class?.name || 'Chưa phân lớp',
      dateOfBirth: student.date_of_birth || '',
      gender: student.gender || '',
      subjects,
      semesterGPA,
      attendanceRate,
      conductGrade: semesterGPA >= 8.0 ? 'Tốt' : semesterGPA >= 6.5 ? 'Khá' : semesterGPA >= 5.0 ? 'Trung bình' : 'Yếu',
    };

    return NextResponse.json(reportCardData);
  } catch (error) {
    console.error('Report card error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report card' },
      { status: 500 }
    );
  }
}
