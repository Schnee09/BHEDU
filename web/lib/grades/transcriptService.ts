/**
 * Transcript Service
 * 
 * Generates comprehensive student transcripts with:
 * - Academic history by semester
 * - GPA calculations
 * - Course details and grades
 * - Academic standing
 * - Class rankings
 */

import { 
  SubjectGrade, 
  SemesterGPA, 
  CumulativeGPA,
  calculateSubjectAverage,
  calculateSemesterGPA,
  calculateCumulativeGPA,
  getLetterGradeFromScore,
  convertTo4PointScale,
} from './gpaCalculator';

export interface TranscriptCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  oralScore?: number;
  fifteenMinScore?: number;
  fortyFiveMinScore?: number;
  midtermScore?: number;
  finalScore?: number;
  averageScore: number | null;
  letterGrade: string;
  status: 'passed' | 'failed' | 'in_progress';
}

export interface TranscriptSemester {
  semesterId: string;
  semesterName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  courses: TranscriptCourse[];
  semesterGPA: number;
  semesterCredits: number;
  semesterCreditsEarned: number;
  classRank?: number;
  classSize?: number;
}

export interface StudentTranscript {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  className: string;
  enrollmentDate: string;
  semesters: TranscriptSemester[];
  cumulativeGPA: number;
  cumulativeGPA4: number; // 4.0 scale
  totalCredits: number;
  totalCreditsEarned: number;
  academicStanding: string;
  percentileRank?: number;
  generatedAt: string;
}

export interface TranscriptGenerationOptions {
  includePending: boolean;
  includeRanking: boolean;
  language: 'vi' | 'en';
}

/**
 * Convert raw grade data to transcript format
 */
export function buildTranscriptCourse(grade: SubjectGrade): TranscriptCourse {
  const averageScore = calculateSubjectAverage(grade);
  const letterGrade = averageScore !== null ? getLetterGradeFromScore(averageScore) : 'N/A';
  
  let status: 'passed' | 'failed' | 'in_progress' = 'in_progress';
  if (averageScore !== null) {
    status = averageScore >= 5.0 ? 'passed' : 'failed';
  }

  return {
    courseId: grade.subjectId,
    courseCode: '', // To be filled from subject data
    courseName: grade.subjectName,
    credits: grade.credits,
    oralScore: grade.oralScore,
    fifteenMinScore: grade.fifteenMinScore,
    fortyFiveMinScore: grade.fortyFiveMinScore,
    midtermScore: grade.midtermScore,
    finalScore: grade.finalScore,
    averageScore,
    letterGrade,
    status,
  };
}

/**
 * Generate a complete student transcript
 */
export function generateTranscript(
  studentInfo: {
    studentId: string;
    studentCode: string;
    fullName: string;
    dateOfBirth: string;
    className: string;
    enrollmentDate: string;
  },
  semesterData: Array<{
    semesterId: string;
    semesterName: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    grades: SubjectGrade[];
    classRank?: number;
    classSize?: number;
  }>,
  options: TranscriptGenerationOptions = { includePending: false, includeRanking: true, language: 'vi' }
): StudentTranscript {
  
  const transcriptSemesters: TranscriptSemester[] = [];
  const allSemesterGPAs: SemesterGPA[] = [];
  let totalCredits = 0;
  let totalCreditsEarned = 0;

  for (const semester of semesterData) {
    // Filter grades if not including pending
    let grades = semester.grades;
    if (!options.includePending) {
      grades = grades.filter(g => {
        const avg = calculateSubjectAverage(g);
        return avg !== null;
      });
    }

    // Build transcript courses
    const courses = grades.map(g => buildTranscriptCourse(g));
    
    // Calculate semester stats
    const semesterGPA = calculateSemesterGPA(
      grades,
      semester.semesterId,
      semester.semesterName,
      semester.academicYear
    );
    allSemesterGPAs.push(semesterGPA);

    const semesterCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const semesterCreditsEarned = courses
      .filter(c => c.status === 'passed')
      .reduce((sum, c) => sum + c.credits, 0);

    totalCredits += semesterCredits;
    totalCreditsEarned += semesterCreditsEarned;

    transcriptSemesters.push({
      semesterId: semester.semesterId,
      semesterName: semester.semesterName,
      academicYear: semester.academicYear,
      startDate: semester.startDate,
      endDate: semester.endDate,
      courses,
      semesterGPA: semesterGPA.gpa,
      semesterCredits,
      semesterCreditsEarned,
      classRank: options.includeRanking ? semester.classRank : undefined,
      classSize: options.includeRanking ? semester.classSize : undefined,
    });
  }

  // Calculate cumulative
  const cumulative = calculateCumulativeGPA(allSemesterGPAs);

  return {
    studentId: studentInfo.studentId,
    studentCode: studentInfo.studentCode,
    fullName: studentInfo.fullName,
    dateOfBirth: studentInfo.dateOfBirth,
    className: studentInfo.className,
    enrollmentDate: studentInfo.enrollmentDate,
    semesters: transcriptSemesters,
    cumulativeGPA: cumulative.gpa,
    cumulativeGPA4: convertTo4PointScale(cumulative.gpa),
    totalCredits,
    totalCreditsEarned,
    academicStanding: cumulative.standing.labelVi,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate class ranking for a semester
 */
export function calculateClassRankings(
  studentGPAs: Array<{ studentId: string; gpa: number }>
): Map<string, { rank: number; percentile: number }> {
  const rankings = new Map<string, { rank: number; percentile: number }>();
  
  // Sort by GPA descending
  const sorted = [...studentGPAs].sort((a, b) => b.gpa - a.gpa);
  const total = sorted.length;

  let currentRank = 1;
  let prevGpa = -1;
  let sameRankCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const student = sorted[i];
    
    if (student.gpa !== prevGpa) {
      currentRank = i + 1;
      sameRankCount = 1;
    } else {
      sameRankCount++;
    }

    const percentile = Math.round(((total - i) / total) * 100);
    
    rankings.set(student.studentId, {
      rank: currentRank,
      percentile,
    });

    prevGpa = student.gpa;
  }

  return rankings;
}

/**
 * Format transcript for display (Vietnamese)
 */
export function formatTranscriptSummary(transcript: StudentTranscript): string {
  const lines = [
    `HỌC BẠ - ${transcript.fullName}`,
    `Mã học sinh: ${transcript.studentCode}`,
    `Lớp: ${transcript.className}`,
    ``,
    `TỔNG KẾT`,
    `- Điểm trung bình tích lũy: ${transcript.cumulativeGPA.toFixed(2)}`,
    `- Điểm GPA (thang 4.0): ${transcript.cumulativeGPA4.toFixed(2)}`,
    `- Tổng số tín chỉ: ${transcript.totalCreditsEarned}/${transcript.totalCredits}`,
    `- Học lực: ${transcript.academicStanding}`,
    ``,
    `CHI TIẾT THEO HỌC KỲ`,
  ];

  for (const semester of transcript.semesters) {
    lines.push(`\n${semester.semesterName} - ${semester.academicYear}`);
    lines.push(`Điểm trung bình: ${semester.semesterGPA.toFixed(2)}`);
    if (semester.classRank && semester.classSize) {
      lines.push(`Xếp hạng: ${semester.classRank}/${semester.classSize}`);
    }
    
    for (const course of semester.courses) {
      const scoreStr = course.averageScore !== null 
        ? course.averageScore.toFixed(1) 
        : 'Chưa có';
      lines.push(`  • ${course.courseName}: ${scoreStr} (${course.letterGrade})`);
    }
  }

  return lines.join('\n');
}

/**
 * Get transcript data for PDF export
 */
export function getTranscriptForExport(transcript: StudentTranscript): {
  header: Record<string, string>;
  summary: Record<string, string | number>;
  semesters: Array<{
    name: string;
    gpa: number;
    courses: Array<{
      name: string;
      credits: number;
      score: number | null;
      grade: string;
    }>;
  }>;
} {
  return {
    header: {
      studentName: transcript.fullName,
      studentCode: transcript.studentCode,
      className: transcript.className,
      dateOfBirth: transcript.dateOfBirth,
      enrollmentDate: transcript.enrollmentDate,
    },
    summary: {
      cumulativeGPA: transcript.cumulativeGPA,
      cumulativeGPA4: transcript.cumulativeGPA4,
      totalCredits: transcript.totalCredits,
      creditsEarned: transcript.totalCreditsEarned,
      academicStanding: transcript.academicStanding,
    },
    semesters: transcript.semesters.map(sem => ({
      name: `${sem.semesterName} - ${sem.academicYear}`,
      gpa: sem.semesterGPA,
      courses: sem.courses.map(c => ({
        name: c.courseName,
        credits: c.credits,
        score: c.averageScore,
        grade: c.letterGrade,
      })),
    })),
  };
}
