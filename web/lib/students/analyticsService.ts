/**
 * Student Analytics Service
 *
 * Provides comprehensive student performance analytics:
 * - Individual performance metrics
 * - Comparison with class/school averages
 * - Progress tracking over time
 * - Early intervention indicators
 * - Strength and weakness analysis
 */

import type { SemesterGPA } from '@/lib/grades/gpaCalculator';
import type { RiskAssessment, GradeTrend } from '@/lib/grades/gradePredictor';

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  currentScore: number;
  classAverage: number;
  schoolAverage: number;
  rank: number;
  totalInClass: number;
  trend: 'up' | 'stable' | 'down';
  isStrength: boolean; // Above class average
  isWeakness: boolean; // Below class average
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
  streak: number; // Current attendance streak
  trend: 'improving' | 'stable' | 'declining';
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  currentGPA: number;
  previousGPA: number;
  gpaChange: number;
  classRank: number;
  classSize: number;
  percentile: number;
  academicStanding: string;
  progressToNextLevel: {
    nextLevel: string | null;
    pointsNeeded: number;
    progressPercent: number;
  };
}

export interface StudentAnalytics {
  basic: {
    studentId: string;
    studentName: string;
    studentCode: string;
    className: string;
    enrollmentDate: string;
  };
  grades: {
    currentGPA: number;
    semesterGPAs: SemesterGPA[];
    trend: GradeTrend;
    subjectPerformances: SubjectPerformance[];
    strengths: string[];
    weaknesses: string[];
  };
  attendance: AttendanceSummary;
  risk: RiskAssessment;
  progress: StudentProgress;
  recommendations: string[];
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  teacherName: string;
  studentCount: number;
  averageGPA: number;
  passRate: number; // Percentage of students with GPA >= 5.0
  excellentRate: number; // Percentage with GPA >= 8.0
  gradeDistribution: {
    excellent: number;
    good: number;
    fair: number;
    average: number;
    weak: number;
  };
  attendanceRate: number;
  topPerformers: Array<{ studentId: string; name: string; gpa: number }>;
  atRiskStudents: Array<{ studentId: string; name: string; gpa: number; riskLevel: string }>;
}

export interface SchoolAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageGPA: number;
  passRate: number;
  attendanceRate: number;
  classComparison: Array<{
    classId: string;
    className: string;
    averageGPA: number;
    studentCount: number;
  }>;
  gradeDistribution: {
    excellent: number;
    good: number;
    fair: number;
    average: number;
    weak: number;
  };
  trends: {
    gpaByMonth: Array<{ month: string; gpa: number }>;
    attendanceByMonth: Array<{ month: string; rate: number }>;
  };
}

/**
 * Calculate student's strengths and weaknesses
 */
export function analyzeStrengthsWeaknesses(subjectPerformances: SubjectPerformance[]): {
  strengths: string[];
  weaknesses: string[];
} {
  const sorted = [...subjectPerformances].sort(
    (a, b) => b.currentScore - b.classAverage - (a.currentScore - a.classAverage)
  );

  const strengths = sorted
    .filter((s) => s.currentScore > s.classAverage + 0.5)
    .slice(0, 3)
    .map((s) => s.subjectName);

  const weaknesses = sorted
    .filter((s) => s.currentScore < s.classAverage - 0.5)
    .slice(-3)
    .map((s) => s.subjectName);

  return { strengths, weaknesses };
}

/**
 * Generate personalized recommendations
 */
export function generateRecommendations(analytics: {
  gpa: number;
  trend: GradeTrend;
  attendance: AttendanceSummary;
  weaknesses: string[];
  risk: RiskAssessment;
}): string[] {
  const recommendations: string[] = [];

  // GPA-based recommendations
  if (analytics.gpa < 5.0) {
    recommendations.push('Cần tập trung cải thiện điểm số ngay lập tức để tránh bị đuổi học');
    recommendations.push('Nên gặp giáo viên chủ nhiệm và phụ huynh để lập kế hoạch hỗ trợ');
  } else if (analytics.gpa < 6.5) {
    recommendations.push('Cần nỗ lực thêm để nâng cao học lực từ Trung bình lên Khá');
  } else if (analytics.gpa >= 8.0) {
    recommendations.push(
      'Tiếp tục phát huy, có thể thử thách bản thân với các cuộc thi học sinh giỏi'
    );
  }

  // Trend-based recommendations
  if (analytics.trend.direction === 'declining') {
    recommendations.push('Điểm số đang có xu hướng giảm, cần xem lại phương pháp học tập');
  } else if (analytics.trend.direction === 'improving') {
    recommendations.push('Điểm số đang cải thiện tốt, tiếp tục duy trì đà tiến bộ');
  }

  // Attendance recommendations
  if (analytics.attendance.attendanceRate < 90) {
    recommendations.push('Cần cải thiện tỷ lệ đi học để không bị thiếu kiến thức');
  }

  // Subject-specific recommendations
  if (analytics.weaknesses.length > 0) {
    recommendations.push(`Cần tập trung cải thiện các môn: ${analytics.weaknesses.join(', ')}`);
  }

  // Risk-based recommendations
  recommendations.push(...analytics.risk.recommendations.slice(0, 2));

  // Remove duplicates and limit
  return [...new Set(recommendations)].slice(0, 5);
}

/**
 * Calculate improvement metrics
 */
export function calculateImprovementMetrics(
  currentGPA: number,
  previousGPA: number,
  targetGPA: number = 8.0
): {
  improvement: number;
  improvementPercent: number;
  onTrack: boolean;
  projectedSemesters: number;
  message: string;
} {
  const improvement = currentGPA - previousGPA;
  const improvementPercent = previousGPA > 0 ? Math.round((improvement / previousGPA) * 100) : 0;

  const gap = targetGPA - currentGPA;
  const onTrack = improvement >= 0 && (currentGPA >= targetGPA || improvement >= 0.2);

  // Project how many semesters to reach target
  let projectedSemesters = 0;
  if (gap > 0 && improvement > 0) {
    projectedSemesters = Math.ceil(gap / improvement);
  } else if (gap <= 0) {
    projectedSemesters = 0;
  } else {
    projectedSemesters = -1; // Cannot project (declining or no improvement)
  }

  let message: string;
  if (currentGPA >= targetGPA) {
    message = `Đã đạt mục tiêu ${targetGPA.toFixed(1)} điểm!`;
  } else if (improvement > 0.5) {
    message = `Tiến bộ vượt bậc! Tăng ${improvement.toFixed(2)} điểm`;
  } else if (improvement > 0) {
    message = `Có tiến bộ, tăng ${improvement.toFixed(2)} điểm`;
  } else if (improvement === 0) {
    message = 'Điểm số ổn định, cần cố gắng thêm';
  } else {
    message = `Điểm giảm ${Math.abs(improvement).toFixed(2)} điểm, cần cải thiện`;
  }

  return {
    improvement,
    improvementPercent,
    onTrack,
    projectedSemesters,
    message,
  };
}

/**
 * Get milestone achievements
 */
export function getMilestones(
  gpa: number,
  attendanceRate: number,
  completedAssignments: number,
  totalAssignments: number
): Array<{
  id: string;
  title: string;
  achieved: boolean;
  progress: number;
  icon: string;
}> {
  return [
    {
      id: 'excellent_gpa',
      title: 'Học sinh Xuất sắc (GPA ≥ 9.0)',
      achieved: gpa >= 9.0,
      progress: Math.min(100, (gpa / 9.0) * 100),
      icon: '🏆',
    },
    {
      id: 'good_gpa',
      title: 'Học sinh Giỏi (GPA ≥ 8.0)',
      achieved: gpa >= 8.0,
      progress: Math.min(100, (gpa / 8.0) * 100),
      icon: '⭐',
    },
    {
      id: 'perfect_attendance',
      title: 'Đi học đầy đủ (100%)',
      achieved: attendanceRate === 100,
      progress: attendanceRate,
      icon: '📅',
    },
    {
      id: 'all_assignments',
      title: 'Hoàn thành tất cả bài tập',
      achieved: completedAssignments === totalAssignments && totalAssignments > 0,
      progress: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
      icon: '✅',
    },
    {
      id: 'passing',
      title: 'Đạt yêu cầu (GPA ≥ 5.0)',
      achieved: gpa >= 5.0,
      progress: Math.min(100, (gpa / 5.0) * 100),
      icon: '📚',
    },
  ];
}

/**
 * Format analytics data for charts
 */
export function formatForCharts(
  semesterGPAs: SemesterGPA[],
  subjectPerformances: SubjectPerformance[]
): {
  gpaChart: Array<{ semester: string; gpa: number; standing: string }>;
  subjectChart: Array<{ subject: string; student: number; classAverage: number }>;
  radarChart: Array<{ subject: string; score: number; fullMark: number }>;
} {
  return {
    gpaChart: semesterGPAs.map((s) => ({
      semester: s.semesterName,
      gpa: s.gpa,
      standing: s.standing.labelVi,
    })),
    subjectChart: subjectPerformances.map((s) => ({
      subject: s.subjectName,
      student: s.currentScore,
      classAverage: s.classAverage,
    })),
    radarChart: subjectPerformances.map((s) => ({
      subject: s.subjectName,
      score: s.currentScore,
      fullMark: 10,
    })),
  };
}

/**
 * Get comparison summary
 */
export function getComparisonSummary(
  studentGPA: number,
  classAverage: number,
  schoolAverage: number
): {
  vsClass: { diff: number; label: string; color: string };
  vsSchool: { diff: number; label: string; color: string };
} {
  const classDiff = studentGPA - classAverage;
  const schoolDiff = studentGPA - schoolAverage;

  const getLabel = (diff: number) => {
    if (diff > 1) return 'Vượt trội';
    if (diff > 0.5) return 'Trên mức';
    if (diff > -0.5) return 'Tương đương';
    if (diff > -1) return 'Dưới mức';
    return 'Cần cải thiện';
  };

  const getColor = (diff: number) => {
    if (diff > 0.5) return 'emerald';
    if (diff > -0.5) return 'blue';
    if (diff > -1) return 'amber';
    return 'red';
  };

  return {
    vsClass: {
      diff: Math.round(classDiff * 100) / 100,
      label: getLabel(classDiff),
      color: getColor(classDiff),
    },
    vsSchool: {
      diff: Math.round(schoolDiff * 100) / 100,
      label: getLabel(schoolDiff),
      color: getColor(schoolDiff),
    },
  };
}
