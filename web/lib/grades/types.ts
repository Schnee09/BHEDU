/**
 * Grade Types - Vietnamese Education System (BH-EDU)
 * Only supports Midterm (Giữa kỳ) and Final (Cuối kỳ) grades
 * with 50:50 weighting
 */

export enum EvaluationType {
  MIDTERM = 'midterm',   // Giữa kỳ (50%)
  FINAL = 'final'        // Cuối kỳ (50%)
}

// Backwards compatibility - map old types to new
export const LEGACY_GRADE_TYPES = {
  ORAL: 'oral',
  FIFTEEN_MIN: 'fifteen_min', 
  ONE_PERIOD: 'one_period',
} as const;

export type Semester = '1' | '2' | 'year';

export interface GradeRow {
  student_id: string;
  [EvaluationType.MIDTERM]?: number | null;
  [EvaluationType.FINAL]?: number | null;
  // Computed average (50:50)
  average?: number | null;
}

export interface StudentGradesPayload {
  class_id: string;
  subject_code: string;
  semester: Semester;
  students: {
    student_id: string;
    grades: Partial<Record<EvaluationType, number | null>>;
  }[];
}

export interface SaveResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  studentErrors: Record<string, string>;
}

/**
 * Calculate average grade (50% midterm + 50% final)
 */
export function calculateAverageGrade(
  midterm: number | null | undefined,
  final: number | null | undefined
): number | null {
  if (midterm !== null && midterm !== undefined && 
      final !== null && final !== undefined) {
    return Math.round(((midterm + final) / 2) * 10) / 10;
  }
  if (midterm !== null && midterm !== undefined) {
    return midterm;
  }
  if (final !== null && final !== undefined) {
    return final;
  }
  return null;
}

/**
 * Grade weight configuration
 */
export const GRADE_WEIGHTS = {
  [EvaluationType.MIDTERM]: 0.5,  // 50%
  [EvaluationType.FINAL]: 0.5,    // 50%
} as const;

/**
 * Vietnamese labels for grade types
 */
export const GRADE_LABELS = {
  [EvaluationType.MIDTERM]: 'Giữa kỳ',
  [EvaluationType.FINAL]: 'Cuối kỳ',
} as const;
