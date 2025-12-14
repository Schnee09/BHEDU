/**
 * Validation schema tests
 */

import {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
} from '@/lib/schemas/students';
import {
  createGradeSchema,
  bulkGradeEntrySchema,
} from '@/lib/schemas/grades';
import {
  loginSchema,
  signupSchema,
} from '@/lib/schemas/auth';
import {
  createPaymentSchema,
  createInvoiceSchema,
} from '@/lib/schemas/finance';

describe('Student Schemas', () => {
  describe('createStudentSchema', () => {
    it('should validate valid student data', () => {
      const validData = {
        full_name: 'John Doe',
        email: 'john@example.com',
      };
      const result = createStudentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        full_name: 'John Doe',
        email: 'not-an-email',
      };
      const result = createStudentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate optional fields', () => {
      const dataWithOptional = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789',
        date_of_birth: '2000-01-15',
        gender: 'male' as const,
      };
      const result = createStudentSchema.safeParse(dataWithOptional);
      expect(result.success).toBe(true);
    });
  });

  describe('updateStudentSchema', () => {
    it('should require ID', () => {
      const dataWithoutId = {
        first_name: 'John',
      };
      const result = updateStudentSchema.safeParse(dataWithoutId);
      expect(result.success).toBe(false);
    });

    it('should validate valid UUID', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'John',
      };
      const result = updateStudentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('studentQuerySchema', () => {
    it('should provide default values', () => {
      const result = studentQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(25);
      }
    });

    it('should parse string numbers', () => {
      const result = studentQuerySchema.safeParse({
        page: '2',
        limit: '10',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });
  });
});

describe('Grade Schemas', () => {
  describe('createGradeSchema', () => {
    it('should validate valid grade data', () => {
      const validData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        assignment_id: '550e8400-e29b-41d4-a716-446655440001',
        score: 8.5,
      };
      const result = createGradeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject score over 10', () => {
      const invalidData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        assignment_id: '550e8400-e29b-41d4-a716-446655440001',
        score: 11,
      };
      const result = createGradeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative score', () => {
      const invalidData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        assignment_id: '550e8400-e29b-41d4-a716-446655440001',
        score: -1,
      };
      const result = createGradeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bulkGradeEntrySchema', () => {
    it('should validate bulk grade entry', () => {
      const validData = {
        assignment_id: '550e8400-e29b-41d4-a716-446655440000',
        grades: [
          { student_id: '550e8400-e29b-41d4-a716-446655440001', score: 9 },
          { student_id: '550e8400-e29b-41d4-a716-446655440002', score: 8 },
        ],
      };
      const result = bulkGradeEntrySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require at least one grade', () => {
      const invalidData = {
        assignment_id: '550e8400-e29b-41d4-a716-446655440000',
        grades: [],
      };
      const result = bulkGradeEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password1',
        confirm_password: 'Password1',
        first_name: 'John',
        last_name: 'Doe',
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Password1',
        confirm_password: 'Password2',
        first_name: 'John',
        last_name: 'Doe',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require uppercase in password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password1',
        confirm_password: 'password1',
        first_name: 'John',
        last_name: 'Doe',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Finance Schemas', () => {
  describe('createPaymentSchema', () => {
    it('should validate valid payment data', () => {
      const validData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 1000000,
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = createPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        amount: -100,
        payment_method_id: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = createPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createInvoiceSchema', () => {
    it('should validate valid invoice data', () => {
      const validData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        academic_year_id: '550e8400-e29b-41d4-a716-446655440001',
        due_date: '2024-12-31',
        items: [
          {
            fee_type_id: '550e8400-e29b-41d4-a716-446655440002',
            description: 'Tuition Fee',
            amount: 5000000,
          },
        ],
      };
      const result = createInvoiceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require at least one item', () => {
      const invalidData = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        academic_year_id: '550e8400-e29b-41d4-a716-446655440001',
        due_date: '2024-12-31',
        items: [],
      };
      const result = createInvoiceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
