/**
 * Validation schemas for Grade-related API requests
 */

import { z } from 'zod';

/**
 * Grade entry schema
 */
export const createGradeSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  assignment_id: z.string().uuid('Invalid assignment ID'),
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score must not exceed 10'),
  notes: z.string().max(500).optional().nullable(),
  graded_at: z.string().datetime().optional(),
});

/**
 * Grade update schema
 */
export const updateGradeSchema = z.object({
  id: z.string().uuid('Invalid grade ID'),
  score: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional().nullable(),
  graded_at: z.string().datetime().optional(),
});

/**
 * Bulk grade entry schema
 */
export const bulkGradeEntrySchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID'),
  grades: z.array(
    z.object({
      student_id: z.string().uuid('Invalid student ID'),
      score: z.number().min(0).max(10),
      notes: z.string().max(500).optional().nullable(),
    })
  ).min(1, 'At least one grade is required').max(100, 'Maximum 100 grades per batch'),
  graded_at: z.string().datetime().optional(),
});

/**
 * Assignment creation schema
 */
export const createAssignmentSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  subject_id: z.string().uuid('Invalid subject ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  assignment_type: z.enum(['homework', 'quiz', 'exam', 'project', 'participation']),
  max_score: z.number().positive('Max score must be positive').default(10),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100').default(1),
  due_date: z.string().date().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
});

/**
 * Grade query parameters
 */
export const gradeQuerySchema = z.object({
  student_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  assignment_id: z.string().uuid().optional(),
  semester: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
});

/**
 * Vietnamese transcript entry schema
 */
export const vietnameseGradeSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  subject_id: z.string().uuid('Invalid subject ID'),
  semester: z.enum(['1', '2', 'final']),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  mieng_scores: z.array(z.number().min(0).max(10)).optional(),
  tx_15_scores: z.array(z.number().min(0).max(10)).optional(),
  tx_1_tiet_scores: z.array(z.number().min(0).max(10)).optional(),
  thi_scores: z.array(z.number().min(0).max(10)).optional(),
  tb_mon: z.number().min(0).max(10).optional().nullable(),
});

/**
 * Conduct grade schema
 */
export const conductGradeSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_id: z.string().uuid('Invalid class ID'),
  semester: z.enum(['1', '2', 'final']),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  conduct_score: z.enum(['Tot', 'Kha', 'TB', 'Yeu']),
  notes: z.string().max(500).optional().nullable(),
});
