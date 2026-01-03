/**
 * Unit tests for grades validation functions
 */

import { validateGrade, validatePayload, ValidationResult } from '@/lib/grades/validation';
import { EvaluationType } from '@/lib/grades/types';

describe('validateGrade', () => {
  describe('valid cases', () => {
    it('should accept null', () => {
      const result = validateGrade(null);
      expect(result.valid).toBe(true);
    });

    it('should accept undefined', () => {
      const result = validateGrade(undefined);
      expect(result.valid).toBe(true);
    });

    it('should accept 0', () => {
      const result = validateGrade(0);
      expect(result.valid).toBe(true);
    });

    it('should accept 10', () => {
      const result = validateGrade(10);
      expect(result.valid).toBe(true);
    });

    it('should accept values between 0 and 10', () => {
      for (const value of [1, 2.5, 5, 7.5, 9.9]) {
        const result = validateGrade(value);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('invalid cases', () => {
    it('should reject negative numbers', () => {
      const result = validateGrade(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be 0-10');
    });

    it('should reject numbers greater than 10', () => {
      const result = validateGrade(10.1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be 0-10');
    });

    it('should reject NaN', () => {
      const result = validateGrade(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be a number');
    });
  });
});

describe('validatePayload', () => {
  const validPayload = {
    class_id: 'class-123',
    subject_code: 'MATH',
    semester: '1',
    students: [
      {
        student_id: 'student-1',
        grades: { [EvaluationType.MIDTERM]: 8 }
      }
    ]
  };

  it('should accept valid payload', () => {
    const result = validatePayload(validPayload);
    expect(result.valid).toBe(true);
  });

  it('should reject missing class_id', () => {
    const result = validatePayload({ ...validPayload, class_id: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing class_id');
  });

  it('should reject missing subject_code', () => {
    const result = validatePayload({ ...validPayload, subject_code: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing subject_code');
  });

  it('should reject missing semester', () => {
    const result = validatePayload({ ...validPayload, semester: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing semester');
  });

  it('should reject non-array students', () => {
    const result = validatePayload({ ...validPayload, students: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid students list');
  });

  it('should accept empty students array', () => {
    const result = validatePayload({ ...validPayload, students: [] });
    expect(result.valid).toBe(true);
  });
});
