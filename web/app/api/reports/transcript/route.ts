/**
 * Transcript Report API Endpoint
 * 
 * Generates complete transcript data for a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  calculateSubjectAverage, 
  getLetterGradeFromScore,
  calculateSemesterGPA,
  calculateCumulativeGPA,
  convertTo4PointScale,
  type SubjectGrade,
} from '@/lib/grades/gpaCalculator';
import { type StudentTranscript, type TranscriptSemester } from '@/lib/grades/transcriptService';

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
      .select('id, full_name, student_id, date_of_birth, created_at')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch enrollment for class name
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('class:class_id(id, name)')
      .eq('student_id', studentId)
      .single();

    // Fetch all semesters
    const { data: academicYears } = await supabase
      .from('academic_years')
      .select('id, name, start_date, end_date')
      .order('start_date', { ascending: true });

    // Fetch all grades for the student
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        id,
        score,
        evaluation_type,
        semester,
        academic_year_id,
        subject:subject_id(id, name),
        class:class_id(id, name),
        created_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    // Group grades by academic year/semester
    const semesterData = new Map<string, {
      academicYear: string;
      semester: string;
      grades: Map<string, SubjectGrade>;
    }>();

    for (const grade of grades || []) {
      const yearId = grade.academic_year_id || 'unknown';
      const semester = grade.semester || 'HK1';
      const key = `${yearId}-${semester}`;
      
      if (!semesterData.has(key)) {
        const year = academicYears?.find(y => y.id === yearId);
        semesterData.set(key, {
          academicYear: year?.name || 'Unknown',
          semester: semester,
          grades: new Map(),
        });
      }

      const semData = semesterData.get(key)!;
      const subjectId = grade.subject?.id || 'unknown';
      const subjectName = grade.subject?.name || 'Unknown';

      if (!semData.grades.has(subjectId)) {
        semData.grades.set(subjectId, {
          subjectId,
          subjectName,
          credits: 1,
        });
      }

      const subjectGrade = semData.grades.get(subjectId)!;
      const evalType = grade.evaluation_type?.toLowerCase() || '';
      
      if (evalType.includes('oral') || evalType.includes('miệng')) {
        subjectGrade.oralScore = grade.score;
      } else if (evalType.includes('15')) {
        subjectGrade.fifteenMinScore = grade.score;
      } else if (evalType.includes('45') || evalType.includes('1 tiết')) {
        subjectGrade.fortyFiveMinScore = grade.score;
      } else if (evalType.includes('midterm') || evalType.includes('giữa')) {
        subjectGrade.midtermScore = grade.score;
      } else if (evalType.includes('final') || evalType.includes('cuối')) {
        subjectGrade.finalScore = grade.score;
      }
    }

    // Build transcript semesters
    const semesters: TranscriptSemester[] = [];
    const allSemesterGPAs: any[] = [];

    for (const [key, data] of semesterData) {
      const courses = Array.from(data.grades.values()).map(g => {
        const avg = calculateSubjectAverage(g);
        return {
          courseId: g.subjectId,
          courseCode: '',
          courseName: g.subjectName,
          credits: g.credits,
          oralScore: g.oralScore,
          fifteenMinScore: g.fifteenMinScore,
          fortyFiveMinScore: g.fortyFiveMinScore,
          midtermScore: g.midtermScore,
          finalScore: g.finalScore,
          averageScore: avg,
          letterGrade: avg ? getLetterGradeFromScore(avg) : 'N/A',
          status: avg === null ? 'in_progress' as const : avg >= 5.0 ? 'passed' as const : 'failed' as const,
        };
      });

      const validCourses = courses.filter(c => c.averageScore !== null);
      const semesterGPA = validCourses.length > 0
        ? validCourses.reduce((sum, c) => sum + (c.averageScore || 0), 0) / validCourses.length
        : 0;
      
      const semesterCredits = courses.reduce((sum, c) => sum + c.credits, 0);
      const creditsEarned = courses.filter(c => c.status === 'passed').reduce((sum, c) => sum + c.credits, 0);

      semesters.push({
        semesterId: key,
        semesterName: data.semester === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2',
        academicYear: data.academicYear,
        startDate: '',
        endDate: '',
        courses,
        semesterGPA,
        semesterCredits,
        semesterCreditsEarned: creditsEarned,
      });

      allSemesterGPAs.push({
        semesterId: key,
        semesterName: data.semester === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2',
        academicYear: data.academicYear,
        gpa: semesterGPA,
        totalCredits: semesterCredits,
        subjectCount: courses.length,
        standing: { code: 'fair', labelVi: 'Khá', labelEn: 'Fair', color: 'cyan', minGpa: 6.5 },
      });
    }

    // Calculate cumulative
    const totalCredits = semesters.reduce((sum, s) => sum + s.semesterCredits, 0);
    const totalCreditsEarned = semesters.reduce((sum, s) => sum + s.semesterCreditsEarned, 0);
    const cumulativeGPA = semesters.length > 0
      ? semesters.reduce((sum, s) => sum + s.semesterGPA * s.semesterCredits, 0) / Math.max(1, totalCredits)
      : 0;

    // Determine standing
    let standing = 'Yếu';
    if (cumulativeGPA >= 9.0) standing = 'Xuất sắc';
    else if (cumulativeGPA >= 8.0) standing = 'Giỏi';
    else if (cumulativeGPA >= 6.5) standing = 'Khá';
    else if (cumulativeGPA >= 5.0) standing = 'Trung bình';

    const transcript: StudentTranscript = {
      studentId: student.id,
      studentCode: student.student_id || '',
      fullName: student.full_name,
      dateOfBirth: student.date_of_birth || '',
      className: enrollment?.class?.name || 'Chưa phân lớp',
      enrollmentDate: student.created_at?.split('T')[0] || '',
      semesters,
      cumulativeGPA,
      cumulativeGPA4: convertTo4PointScale(cumulativeGPA),
      totalCredits,
      totalCreditsEarned,
      academicStanding: standing,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(transcript);
  } catch (error) {
    console.error('Transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to generate transcript' },
      { status: 500 }
    );
  }
}
