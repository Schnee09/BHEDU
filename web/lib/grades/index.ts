/**
 * Grades Module Exports
 * 
 * Central export point for all grade-related services and utilities.
 */

// GPA Calculator
export {
  calculateSubjectAverage,
  calculateSemesterGPA,
  calculateCumulativeGPA,
  getAcademicStanding,
  convertTo4PointScale,
  getLetterGradeFromScore,
  formatGPA,
  getProgressToNextStanding,
  calculateRequiredGrade,
  ACADEMIC_STANDINGS,
  GRADE_COEFFICIENTS,
  type SubjectGrade,
  type SemesterGPA,
  type CumulativeGPA,
  type AcademicStanding,
} from './gpaCalculator';

// Transcript Service
export {
  generateTranscript,
  buildTranscriptCourse,
  calculateClassRankings,
  formatTranscriptSummary,
  getTranscriptForExport,
  type TranscriptCourse,
  type TranscriptSemester,
  type StudentTranscript,
  type TranscriptGenerationOptions,
} from './transcriptService';

// Grade Predictor
export {
  calculateGradeTrend,
  assessRisk,
  predictFinalGrade,
  calculateRequiredFinalScore,
  getPerformanceMetrics,
  type GradeTrend,
  type RiskAssessment,
  type RiskFactor,
  type PredictionResult,
  type PerformanceMetrics,
} from './gradePredictor';
