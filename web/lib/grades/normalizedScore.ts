export interface GradeScoreInput {
  score?: number | null;
  points_earned?: number | null;
}

/**
 * Returns the canonical 10-point score. Raw points are only a safe fallback
 * for legacy rows when they already fit the 10-point scale.
 */
export function getNormalizedGradeScore(grade: GradeScoreInput): number | null {
  if (
    typeof grade.score === 'number' &&
    Number.isFinite(grade.score) &&
    grade.score >= 0 &&
    grade.score <= 10
  ) {
    return grade.score;
  }

  if (
    typeof grade.points_earned === 'number' &&
    Number.isFinite(grade.points_earned) &&
    grade.points_earned >= 0 &&
    grade.points_earned <= 10
  ) {
    return grade.points_earned;
  }

  return null;
}
