/**
 * Grade Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import {
    gradeComponentSchema,
    paginationSchema,
    semesterSchema,
    uuidSchema,
} from "../common";

// ============================================
// GRADE CREATION
// ============================================

/**
 * Score validator (0-10 scale)
 */
export const scoreSchema = z.coerce.number()
    .min(0, "Score must be at least 0")
    .max(10, "Score must be at most 10");

/**
 * Coefficient validator (1, 2, or 3)
 */
export const coefficientSchema = z.coerce.number()
    .int()
    .min(1, "Coefficient must be at least 1")
    .max(3, "Coefficient must be at most 3");

/**
 * Create grade request schema
 */
export const createGradeSchema = z.object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    subject_id: uuidSchema,
    score: scoreSchema,
    component_type: gradeComponentSchema,
    coefficient: coefficientSchema.default(1),
    semester: semesterSchema,
    academic_year_id: uuidSchema,
    notes: z.string().max(500).optional().nullable(),
    recorded_at: z.string().datetime().optional(),
});

// ============================================
// GRADE UPDATE
// ============================================

/**
 * Update grade request schema
 */
export const updateGradeSchema = z.object({
    score: scoreSchema.optional(),
    component_type: gradeComponentSchema.optional(),
    coefficient: coefficientSchema.optional(),
    notes: z.string().max(500).optional().nullable(),
});

// ============================================
// BULK GRADE CREATION
// ============================================

/**
 * Bulk grade creation schema
 */
export const bulkCreateGradesSchema = z.object({
    class_id: uuidSchema,
    subject_id: uuidSchema,
    component_type: gradeComponentSchema,
    coefficient: coefficientSchema.default(1),
    semester: semesterSchema,
    academic_year_id: uuidSchema,
    grades: z.array(z.object({
        student_id: uuidSchema,
        score: scoreSchema,
        notes: z.string().max(500).optional().nullable(),
    })).min(1, "At least one grade required").max(
        100,
        "Maximum 100 grades per batch",
    ),
});

// ============================================
// GRADE QUERY
// ============================================

/**
 * Grade query parameters
 */
export const gradeQuerySchema = paginationSchema.extend({
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    subject_id: uuidSchema.optional(),
    component_type: gradeComponentSchema.optional(),
    semester: semesterSchema.optional(),
    academic_year_id: uuidSchema.optional(),
    min_score: z.coerce.number().min(0).max(10).optional(),
    max_score: z.coerce.number().min(0).max(10).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type BulkCreateGradesInput = z.infer<typeof bulkCreateGradesSchema>;
export type GradeQuery = z.infer<typeof gradeQuerySchema>;
