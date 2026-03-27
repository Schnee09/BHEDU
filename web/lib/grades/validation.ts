export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateGrade(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true };
  }
  if (typeof value !== 'number') {
    return { valid: false, error: 'Must be a number' };
  }

  if (!isFinite(value) || isNaN(value)) {
    return { valid: false, error: 'Must be a number' };
  }

  if (value < 0 || value > 10) {
    return { valid: false, error: 'Must be 0-10' };
  }

  return { valid: true };
}

export function validatePayload(payload: any): ValidationResult {
  if (!payload.class_id) return { valid: false, error: 'Missing class_id' };
  if (!payload.subject_code) return { valid: false, error: 'Missing subject_code' };
  if (!payload.semester) return { valid: false, error: 'Missing semester' };
  if (!Array.isArray(payload.students)) return { valid: false, error: 'Invalid students list' };

  return { valid: true };
}
