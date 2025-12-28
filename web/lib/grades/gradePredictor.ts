/**
 * Grade Predictor Service
 * 
 * Provides grade predictions and early warning indicators:
 * - Linear regression for grade trend prediction
 * - Early warning for at-risk students
 * - Target grade calculator
 * - Performance forecasting
 */

import { SubjectGrade, calculateSubjectAverage, getAcademicStanding } from './gpaCalculator';

export interface GradeTrend {
  slope: number;           // Rate of change per time unit
  direction: 'improving' | 'stable' | 'declining';
  predictedNextGrade: number;
  confidence: number;      // 0-100%
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;       // 0-100
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  type: 'grade_decline' | 'low_performance' | 'missing_assignments' | 'attendance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  weight: number;
}

export interface PredictionResult {
  predictedGrade: number;
  confidence: number;
  bestCase: number;
  worstCase: number;
  requiredEffort: 'minimal' | 'moderate' | 'significant' | 'extreme';
}

export interface PerformanceMetrics {
  currentAverage: number;
  trend: GradeTrend;
  risk: RiskAssessment;
  prediction: PredictionResult;
  comparisonToClassAverage: number; // positive = above, negative = below
}

/**
 * Calculate linear regression for grade trend
 */
export function calculateGradeTrend(grades: Array<{ date: Date; score: number }>): GradeTrend {
  if (grades.length < 2) {
    return {
      slope: 0,
      direction: 'stable',
      predictedNextGrade: grades.length > 0 ? grades[grades.length - 1].score : 0,
      confidence: 0,
    };
  }

  // Sort by date
  const sorted = [...grades].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Convert dates to numeric x values (days from first date)
  const firstDate = sorted[0].date.getTime();
  const points = sorted.map((g, i) => ({
    x: (g.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // days
    y: g.score,
  }));

  // Calculate linear regression
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next grade (30 days from last)
  const lastX = points[points.length - 1].x;
  const predictedNextGrade = Math.max(0, Math.min(10, intercept + slope * (lastX + 30)));

  // Calculate R² for confidence
  const meanY = sumY / n;
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssResidual = points.reduce((sum, p) => {
    const predicted = intercept + slope * p.x;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
  const confidence = Math.round(Math.max(0, r2) * 100);

  // Determine direction (per week)
  const weeklySlope = slope * 7;
  let direction: 'improving' | 'stable' | 'declining';
  if (weeklySlope > 0.1) direction = 'improving';
  else if (weeklySlope < -0.1) direction = 'declining';
  else direction = 'stable';

  return {
    slope: Math.round(slope * 1000) / 1000, // per day
    direction,
    predictedNextGrade: Math.round(predictedNextGrade * 100) / 100,
    confidence,
  };
}

/**
 * Assess student risk level
 */
export function assessRisk(
  currentGPA: number,
  trend: GradeTrend,
  missingAssignments: number,
  attendanceRate: number
): RiskAssessment {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Factor 1: Low GPA
  if (currentGPA < 5.0) {
    factors.push({
      type: 'low_performance',
      severity: 'high',
      description: 'Điểm trung bình dưới mức đạt yêu cầu',
      weight: 35,
    });
    totalScore += 35;
  } else if (currentGPA < 6.5) {
    factors.push({
      type: 'low_performance',
      severity: 'medium',
      description: 'Điểm trung bình ở mức trung bình',
      weight: 20,
    });
    totalScore += 20;
  }

  // Factor 2: Declining trend
  if (trend.direction === 'declining') {
    const severity = trend.slope < -0.05 ? 'high' : 'medium';
    factors.push({
      type: 'grade_decline',
      severity,
      description: 'Điểm số có xu hướng giảm',
      weight: severity === 'high' ? 30 : 15,
    });
    totalScore += severity === 'high' ? 30 : 15;
  }

  // Factor 3: Missing assignments
  if (missingAssignments > 3) {
    factors.push({
      type: 'missing_assignments',
      severity: 'high',
      description: `Thiếu ${missingAssignments} bài tập`,
      weight: 25,
    });
    totalScore += 25;
  } else if (missingAssignments > 0) {
    factors.push({
      type: 'missing_assignments',
      severity: 'low',
      description: `Thiếu ${missingAssignments} bài tập`,
      weight: 10,
    });
    totalScore += 10;
  }

  // Factor 4: Low attendance
  if (attendanceRate < 80) {
    factors.push({
      type: 'attendance',
      severity: 'high',
      description: `Tỷ lệ đi học chỉ ${attendanceRate}%`,
      weight: 20,
    });
    totalScore += 20;
  } else if (attendanceRate < 90) {
    factors.push({
      type: 'attendance',
      severity: 'medium',
      description: `Tỷ lệ đi học ${attendanceRate}%`,
      weight: 10,
    });
    totalScore += 10;
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 60) riskLevel = 'critical';
  else if (totalScore >= 40) riskLevel = 'high';
  else if (totalScore >= 20) riskLevel = 'medium';
  else riskLevel = 'low';

  // Generate recommendations
  const recommendations = generateRecommendations(factors, currentGPA);

  return {
    riskLevel,
    riskScore: Math.min(100, totalScore),
    factors,
    recommendations,
  };
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(factors: RiskFactor[], currentGPA: number): string[] {
  const recommendations: string[] = [];

  for (const factor of factors) {
    switch (factor.type) {
      case 'low_performance':
        recommendations.push('Tham gia lớp phụ đạo hoặc học thêm');
        recommendations.push('Gặp giáo viên để được hỗ trợ');
        break;
      case 'grade_decline':
        recommendations.push('Xem lại phương pháp học tập');
        recommendations.push('Lập kế hoạch học tập chi tiết');
        break;
      case 'missing_assignments':
        recommendations.push('Hoàn thành các bài tập còn thiếu');
        recommendations.push('Sử dụng lịch nhắc nhở deadline');
        break;
      case 'attendance':
        recommendations.push('Cải thiện tỷ lệ đi học');
        recommendations.push('Liên hệ phụ huynh nếu cần hỗ trợ');
        break;
    }
  }

  // Add GPA-specific recommendations
  if (currentGPA < 5.0) {
    recommendations.push('Cần nỗ lực đặc biệt để đạt điểm đủ qua học kỳ');
  } else if (currentGPA >= 8.0 && factors.length === 0) {
    recommendations.push('Duy trì phong độ học tập tốt hiện tại');
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

/**
 * Predict final grades
 */
export function predictFinalGrade(
  currentScores: SubjectGrade[],
  completedWeight: number, // percentage of course completed
  trend: GradeTrend
): PredictionResult {
  // Calculate current average
  const validGrades = currentScores.filter(g => calculateSubjectAverage(g) !== null);
  if (validGrades.length === 0) {
    return {
      predictedGrade: 0,
      confidence: 0,
      bestCase: 0,
      worstCase: 0,
      requiredEffort: 'extreme',
    };
  }

  const currentAvg = validGrades.reduce((sum, g) => sum + (calculateSubjectAverage(g) || 0), 0) / validGrades.length;
  
  // Apply trend adjustment
  const trendAdjustment = trend.slope * 30 * ((100 - completedWeight) / 100);
  const predictedGrade = Math.max(0, Math.min(10, currentAvg + trendAdjustment));

  // Calculate confidence based on completion and trend confidence
  const completionConfidence = Math.min(100, completedWeight);
  const confidence = Math.round((completionConfidence * 0.6) + (trend.confidence * 0.4));

  // Best and worst case scenarios
  const variance = (100 - confidence) / 100 * 2; // Max 2 points variance
  const bestCase = Math.min(10, predictedGrade + variance);
  const worstCase = Math.max(0, predictedGrade - variance);

  // Determine required effort
  const gap = 8.0 - predictedGrade; // Gap to "Good" standing
  let requiredEffort: 'minimal' | 'moderate' | 'significant' | 'extreme';
  if (gap <= 0) requiredEffort = 'minimal';
  else if (gap < 1) requiredEffort = 'moderate';
  else if (gap < 2) requiredEffort = 'significant';
  else requiredEffort = 'extreme';

  return {
    predictedGrade: Math.round(predictedGrade * 100) / 100,
    confidence,
    bestCase: Math.round(bestCase * 100) / 100,
    worstCase: Math.round(worstCase * 100) / 100,
    requiredEffort,
  };
}

/**
 * Calculate what score is needed on final exam to achieve target GPA
 */
export function calculateRequiredFinalScore(
  currentComponentScores: {
    oral?: number;
    fifteenMin?: number;
    fortyFiveMin?: number;
    midterm?: number;
  },
  targetGPA: number
): { requiredScore: number; isPossible: boolean; message: string } {
  // Component weights
  const oralWeight = currentComponentScores.oral !== undefined ? 1 : 0;
  const fifteenMinWeight = currentComponentScores.fifteenMin !== undefined ? 1 : 0;
  const fortyFiveMinWeight = currentComponentScores.fortyFiveMin !== undefined ? 2 : 0;
  const midtermWeight = currentComponentScores.midterm !== undefined ? 2 : 0;
  const finalWeight = 3;

  const currentWeight = oralWeight + fifteenMinWeight + fortyFiveMinWeight + midtermWeight;
  const totalWeight = currentWeight + finalWeight;

  // Calculate current weighted sum
  let currentSum = 0;
  if (currentComponentScores.oral !== undefined) currentSum += currentComponentScores.oral * 1;
  if (currentComponentScores.fifteenMin !== undefined) currentSum += currentComponentScores.fifteenMin * 1;
  if (currentComponentScores.fortyFiveMin !== undefined) currentSum += currentComponentScores.fortyFiveMin * 2;
  if (currentComponentScores.midterm !== undefined) currentSum += currentComponentScores.midterm * 2;

  // Calculate required final score
  const requiredSum = targetGPA * totalWeight;
  const requiredFinal = (requiredSum - currentSum) / finalWeight;

  if (requiredFinal > 10) {
    return {
      requiredScore: 10,
      isPossible: false,
      message: `Không thể đạt điểm ${targetGPA} ngay cả khi đạt điểm tối đa ở bài thi cuối kỳ`,
    };
  }

  if (requiredFinal < 0) {
    return {
      requiredScore: 0,
      isPossible: true,
      message: `Bạn đã chắc chắn đạt điểm ${targetGPA} hoặc cao hơn`,
    };
  }

  return {
    requiredScore: Math.round(requiredFinal * 100) / 100,
    isPossible: true,
    message: `Cần đạt ít nhất ${requiredFinal.toFixed(1)} điểm ở bài thi cuối kỳ`,
  };
}

/**
 * Get performance comparison metrics
 */
export function getPerformanceMetrics(
  studentGrades: SubjectGrade[],
  classAverageGPA: number,
  attendanceRate: number = 100,
  missingAssignments: number = 0
): PerformanceMetrics {
  // Calculate current average
  const validGrades = studentGrades.filter(g => calculateSubjectAverage(g) !== null);
  const currentAverage = validGrades.length > 0
    ? validGrades.reduce((sum, g) => sum + (calculateSubjectAverage(g) || 0), 0) / validGrades.length
    : 0;

  // Create grade history for trend (mock dates for now)
  const gradeHistory = validGrades.map((g, i) => ({
    date: new Date(Date.now() - (validGrades.length - i) * 7 * 24 * 60 * 60 * 1000),
    score: calculateSubjectAverage(g) || 0,
  }));

  const trend = calculateGradeTrend(gradeHistory);
  const risk = assessRisk(currentAverage, trend, missingAssignments, attendanceRate);
  const prediction = predictFinalGrade(studentGrades, 50, trend);

  return {
    currentAverage,
    trend,
    risk,
    prediction,
    comparisonToClassAverage: Math.round((currentAverage - classAverageGPA) * 100) / 100,
  };
}
