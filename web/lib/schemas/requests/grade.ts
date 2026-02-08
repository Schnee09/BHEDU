/**
 * Grade Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 * Supports both traditional coefficient-based and new assignment-based models.
 */

import { z } from "zod";
import {
    gradeComponentSchema,
    paginationSchema,
    semesterSchema,
    uuidSchema,
} from "../common";

// ============================================
// HELPERS
// ============================================

const pointsEarnedSchema = z.number().min(0, "Points must be at least 0");
const scoreSchema = z.coerce.number().min(0).max(10);
const coefficientSchema = z.coerce.number().int().min(1).max(3);

// ============================================
// ASSIGNMENTS
// ============================================

export const createAssignmentSchema = z.object({
    class_id: uuidSchema,
    subject_id: uuidSchema,
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(1000).optional().nullable(),
    assignment_type: z.enum([
        "homework",
        "quiz",
        "exam",
        "project",
        "participation",
    ]),
    total_points: z.number().positive().default(10),
    weight: z.number().min(0).max(100).default(1),
    due_date: z.string().date().optional().nullable(),
    category_id: uuidSchema.optional().nullable(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

// ============================================
// GRADE ENTRY
// ============================================

/**
 * Combined Grade entry schema
 */
export const createGradeSchema = z.object({
    student_id: uuidSchema,
    // Assignment model
    assignment_id: uuidSchema.optional().nullable(),
    points_earned: pointsEarnedSchema.optional().nullable(),
    late: z.boolean().optional().default(false),
    excused: z.boolean().optional().default(false),
    missing: z.boolean().optional().default(false),
    feedback: z.string().max(2000).optional().nullable(),

    // Traditional model
    class_id: uuidSchema.optional().nullable(),
    subject_id: uuidSchema.optional().nullable(),
    score: scoreSchema.optional().nullable(),
    component_type: gradeComponentSchema.optional().nullable(),
    coefficient: coefficientSchema.default(1),
    semester: semesterSchema.optional().nullable(),
    academic_year_id: uuidSchema.optional().nullable(),

    // Common
    notes: z.string().max(500).optional().nullable(),
    recorded_at: z.string().datetime().optional(),
    graded_at: z.string().datetime().optional(), // Alias
});

export const updateGradeSchema = createGradeSchema.partial().extend({
    id: uuidSchema.optional(),
});

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkGradeEntrySchema = z.object({
    assignment_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    subject_id: uuidSchema.optional(),
    semester: semesterSchema.optional(),
    academic_year_id: uuidSchema.optional(),
    grades: z.array(z.object({
        student_id: uuidSchema,
        points_earned: pointsEarnedSchema.optional().nullable(),
        score: scoreSchema.optional().nullable(),
        late: z.boolean().optional(),
        excused: z.boolean().optional(),
        missing: z.boolean().optional(),
        feedback: z.string().max(2000).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
    })).min(1).max(100),
    graded_at: z.string().datetime().optional(),
});

// Alias for compatibility
export const bulkCreateGradesSchema = bulkGradeEntrySchema;

// ============================================
// SPECIALIZED GRADES
// ============================================

export const vietnameseGradeSchema = z.object({
    student_id: uuidSchema,
    subject_id: uuidSchema,
    semester: z.enum(["1", "2", "final"]),
    academic_year_id: uuidSchema,
    mieng_scores: z.array(z.number().min(0).max(10)).optional(),
    tx_15_scores: z.array(z.number().min(0).max(10)).optional(),
    tx_1_tiet_scores: z.array(z.number().min(0).max(10)).optional(),
    thi_scores: z.array(z.number().min(0).max(10)).optional(),
    tb_mon: z.number().min(0).max(10).optional().nullable(),
});

export const conductGradeSchema = z.object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    semester: z.enum(["1", "2", "final"]),
    academic_year_id: uuidSchema,
    conduct_score: z.enum(["Tot", "Kha", "TB", "Yeu"]),
    notes: z.string().max(500).optional().nullable(),
});

// ============================================
// QUERIES
// ============================================

export const gradeQuerySchema = paginationSchema.extend({
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    subject_id: uuidSchema.optional(),
    assignment_id: uuidSchema.optional(),
    component_type: gradeComponentSchema.optional(),
    semester: z.string().optional(),
    academic_year_id: uuidSchema.optional(),
    min_score: z.coerce.number().min(0).max(10).optional(),
    max_score: z.coerce.number().min(0).max(10).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type BulkGradeEntryInput = z.infer<typeof bulkGradeEntrySchema>;
export type VietnameseGradeInput = z.infer<typeof vietnameseGradeSchema>;
export type ConductGradeInput = z.infer<typeof conductGradeSchema>;
export type GradeQuery = z.infer<typeof gradeQuerySchema>;
