/**
 * Vietnamese GPA Calculator Service
 * 
 * Implements the Vietnamese education grading system:
 * - 10-point scale (0-10)
 * - Academic standing: Xuất sắc (>=9.0), Giỏi (>=8.0), Khá (>=6.5), Trung bình (>=5.0), Yếu (<5.0)
 * - Semester and Cumulative GPA calculation
 * - Grade weight coefficients for Vietnamese system
 */

export interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  credits: number;
  oralScore?: number;        // Điểm miệng (coefficient 1)
  fifteenMinScore?: number;  // Điểm 15 phút (coefficient 1)
  fortyFiveMinScore?: number; // Điểm 1 tiết (coefficient 2)
  midtermScore?: number;     // Điểm giữa kỳ (coefficient 2)
  finalScore?: number;       // Điểm cuối kỳ (coefficient 3)
}

export interface SemesterGPA {
  semesterId: string;
  semesterName: string;
  academicYear: string;
  gpa: number;
  totalCredits: number;
  subjectCount: number;
  standing: AcademicStanding;
}

export interface CumulativeGPA {
  gpa: number;
  totalCredits: number;
  semesters: SemesterGPA[];
  standing: AcademicStanding;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AcademicStanding {
  code: 'excellent' | 'good' | 'fair' | 'average' | 'weak' | 'failing';
  labelVi: string;
  labelEn: string;
  color: string;
  minGpa: number;
}

// Vietnamese Academic Standing definitions
export const ACADEMIC_STANDINGS: AcademicStanding[] = [
  { code: 'excellent', labelVi: 'Xuất sắc', labelEn: 'Excellent', color: 'emerald', minGpa: 9.0 },
  { code: 'good', labelVi: 'Giỏi', labelEn: 'Good', color: 'blue', minGpa: 8.0 },
  { code: 'fair', labelVi: 'Khá', labelEn: 'Fair', color: 'cyan', minGpa: 6.5 },
  { code: 'average', labelVi: 'Trung bình', labelEn: 'Average', color: 'amber', minGpa: 5.0 },
  { code: 'weak', labelVi: 'Yếu', labelEn: 'Weak', color: 'orange', minGpa: 3.5 },
  { code: 'failing', labelVi: 'Kém', labelEn: 'Failing', color: 'red', minGpa: 0 },
];

// Vietnamese grade type coefficients
export const GRADE_COEFFICIENTS = {
  oral: 1,           // Điểm miệng
  fifteenMin: 1,     // Điểm 15 phút
  fortyFiveMin: 2,   // Điểm 1 tiết
  midterm: 2,        // Điểm giữa kỳ
  final: 3,          // Điểm cuối kỳ
};

/**
 * Calculate subject average using Vietnamese coefficient system
 */
export function calculateSubjectAverage(grade: SubjectGrade): number | null {
  const scores: { value: number; coefficient: number }[] = [];

  if (grade.oralScore !== undefined && grade.oralScore !== null) {
    scores.push({ value: grade.oralScore, coefficient: GRADE_COEFFICIENTS.oral });
  }
  if (grade.fifteenMinScore !== undefined && grade.fifteenMinScore !== null) {
    scores.push({ value: grade.fifteenMinScore, coefficient: GRADE_COEFFICIENTS.fifteenMin });
  }
  if (grade.fortyFiveMinScore !== undefined && grade.fortyFiveMinScore !== null) {
    scores.push({ value: grade.fortyFiveMinScore, coefficient: GRADE_COEFFICIENTS.fortyFiveMin });
  }
  if (grade.midtermScore !== undefined && grade.midtermScore !== null) {
    scores.push({ value: grade.midtermScore, coefficient: GRADE_COEFFICIENTS.midterm });
  }
  if (grade.finalScore !== undefined && grade.finalScore !== null) {
    scores.push({ value: grade.finalScore, coefficient: GRADE_COEFFICIENTS.final });
  }

  if (scores.length === 0) return null;

  const totalWeight = scores.reduce((sum, s) => sum + s.coefficient, 0);
  const weightedSum = scores.reduce((sum, s) => sum + s.value * s.coefficient, 0);

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Calculate semester GPA from subject grades
 */
export function calculateSemesterGPA(
  grades: SubjectGrade[],
  semesterId: string,
  semesterName: string,
  academicYear: string
): SemesterGPA {
  const validGrades = grades
    .map(g => ({ ...g, average: calculateSubjectAverage(g) }))
    .filter(g => g.average !== null);

  if (validGrades.length === 0) {
    return {
      semesterId,
      semesterName,
      academicYear,
      gpa: 0,
      totalCredits: 0,
      subjectCount: 0,
      standing: getAcademicStanding(0),
    };
  }

  const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);
  const weightedSum = validGrades.reduce((sum, g) => sum + (g.average! * g.credits), 0);
  const gpa = Math.round((weightedSum / totalCredits) * 100) / 100;

  return {
    semesterId,
    semesterName,
    academicYear,
    gpa,
    totalCredits,
    subjectCount: validGrades.length,
    standing: getAcademicStanding(gpa),
  };
}

/**
 * Calculate cumulative GPA from multiple semesters
 */
export function calculateCumulativeGPA(semesters: SemesterGPA[]): CumulativeGPA {
  if (semesters.length === 0) {
    return {
      gpa: 0,
      totalCredits: 0,
      semesters: [],
      standing: getAcademicStanding(0),
      trend: 'stable',
    };
  }

  const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);
  const weightedSum = semesters.reduce((sum, s) => sum + (s.gpa * s.totalCredits), 0);
  const gpa = totalCredits > 0 ? Math.round((weightedSum / totalCredits) * 100) / 100 : 0;

  // Calculate trend based on last 3 semesters
  const trend = calculateTrend(semesters);

  return {
    gpa,
    totalCredits,
    semesters,
    standing: getAcademicStanding(gpa),
    trend,
  };
}

/**
 * Get academic standing from GPA
 */
export function getAcademicStanding(gpa: number): AcademicStanding {
  for (const standing of ACADEMIC_STANDINGS) {
    if (gpa >= standing.minGpa) {
      return standing;
    }
  }
  return ACADEMIC_STANDINGS[ACADEMIC_STANDINGS.length - 1];
}

/**
 * Calculate GPA trend from semesters
 */
function calculateTrend(semesters: SemesterGPA[]): 'improving' | 'stable' | 'declining' {
  if (semesters.length < 2) return 'stable';

  const recentSemesters = semesters.slice(-3);
  if (recentSemesters.length < 2) return 'stable';

  const firstGPA = recentSemesters[0].gpa;
  const lastGPA = recentSemesters[recentSemesters.length - 1].gpa;
  const difference = lastGPA - firstGPA;

  if (difference > 0.3) return 'improving';
  if (difference < -0.3) return 'declining';
  return 'stable';
}

/**
 * Convert Vietnamese 10-point scale to 4.0 GPA scale (for international comparison)
 */
export function convertTo4PointScale(vietnameseGPA: number): number {
  if (vietnameseGPA >= 9.0) return 4.0;
  if (vietnameseGPA >= 8.5) return 3.7;
  if (vietnameseGPA >= 8.0) return 3.5;
  if (vietnameseGPA >= 7.0) return 3.0;
  if (vietnameseGPA >= 6.5) return 2.5;
  if (vietnameseGPA >= 5.5) return 2.0;
  if (vietnameseGPA >= 5.0) return 1.5;
  if (vietnameseGPA >= 4.0) return 1.0;
  return 0.0;
}

/**
 * Get letter grade from Vietnamese score (0-10)
 */
export function getLetterGradeFromScore(score: number): string {
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'A-';
  if (score >= 7.0) return 'B+';
  if (score >= 6.5) return 'B';
  if (score >= 5.5) return 'B-';
  if (score >= 5.0) return 'C+';
  if (score >= 4.5) return 'C';
  if (score >= 4.0) return 'C-';
  if (score >= 3.0) return 'D';
  return 'F';
}

/**
 * Format GPA for display
 */
export function formatGPA(gpa: number, decimals: number = 2): string {
  return gpa.toFixed(decimals);
}

/**
 * Get progress towards next academic standing
 */
export function getProgressToNextStanding(gpa: number): {
  nextStanding: AcademicStanding | null;
  pointsNeeded: number;
  progressPercent: number;
} {
  const currentStanding = getAcademicStanding(gpa);
  const currentIndex = ACADEMIC_STANDINGS.findIndex(s => s.code === currentStanding.code);
  
  if (currentIndex === 0) {
    // Already at highest standing
    return {
      nextStanding: null,
      pointsNeeded: 0,
      progressPercent: 100,
    };
  }

  const nextStanding = ACADEMIC_STANDINGS[currentIndex - 1];
  const pointsNeeded = Math.round((nextStanding.minGpa - gpa) * 100) / 100;
  
  // Calculate progress within current standing range
  const currentMin = currentStanding.minGpa;
  const nextMin = nextStanding.minGpa;
  const range = nextMin - currentMin;
  const progress = gpa - currentMin;
  const progressPercent = Math.min(100, Math.round((progress / range) * 100));

  return {
    nextStanding,
    pointsNeeded,
    progressPercent,
  };
}

/**
 * Calculate what grade is needed on remaining assignments to reach target GPA
 */
export function calculateRequiredGrade(
  currentAverage: number,
  currentWeight: number,
  targetGPA: number,
  remainingWeight: number
): number | null {
  if (remainingWeight <= 0) return null;
  
  const totalWeight = currentWeight + remainingWeight;
  const targetTotal = targetGPA * totalWeight;
  const currentTotal = currentAverage * currentWeight;
  const needed = (targetTotal - currentTotal) / remainingWeight;
  
  if (needed > 10) return null; // Impossible to achieve
  if (needed < 0) return 0; // Already exceeded target
  
  return Math.round(needed * 100) / 100;
}
