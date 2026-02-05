/**
 * Grade Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import {
    gradeComponentSchema,
    semesterSchema,
    timestampSchema,
    uuidSchema,
} from "../common";

// ============================================
// GRADE RESPONSE
// ============================================

/**
 * Base grade response schema
 */
export const gradeSchema = z.object({
    id: uuidSchema,
    student_id: uuidSchema,
    class_id: uuidSchema,
    subject_id: uuidSchema,
    score: z.number(),
    component_type: gradeComponentSchema,
    coefficient: z.number().int(),
    semester: semesterSchema,
    academic_year_id: uuidSchema,
    notes: z.string().nullable(),
    recorded_at: timestampSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
});

// ============================================
// GRADE WITH RELATIONS
// ============================================

/**
 * Grade with student information
 */
export const gradeWithStudentSchema = gradeSchema.extend({
    student: z.object({
        id: uuidSchema,
        full_name: z.string(),
        student_code: z.string(),
        email: z.string().email(),
    }),
});

/**
 * Grade with subject information
 */
export const gradeWithSubjectSchema = gradeSchema.extend({
    subject: z.object({
        id: uuidSchema,
        name: z.string(),
        code: z.string(),
    }),
});

/**
 * Grade with full relations
 */
export const gradeWithRelationsSchema = gradeSchema.extend({
    student: z.object({
        id: uuidSchema,
        full_name: z.string(),
        student_code: z.string(),
        email: z.string().email(),
    }),
    subject: z.object({
        id: uuidSchema,
        name: z.string(),
        code: z.string(),
    }),
    class: z.object({
        id: uuidSchema,
        name: z.string(),
        code: z.string().optional(),
    }).optional(),
});

// ============================================
// GRADE STATISTICS
// ============================================

/**
 * Grade statistics response
 */
export const gradeStatisticsSchema = z.object({
    subject_id: uuidSchema,
    subject_name: z.string(),
    average: z.number(),
    highest: z.number(),
    lowest: z.number(),
    total_grades: z.number().int(),
    component_averages: z.record(z.string(), z.number()).optional(),
});

/**
 * Student grade summary
 */
export const studentGradeSummarySchema = z.object({
    student_id: uuidSchema,
    semester: semesterSchema,
    academic_year_id: uuidSchema,
    gpa: z.number(),
    total_subjects: z.number().int(),
    subjects: z.array(z.object({
        subject_id: uuidSchema,
        subject_name: z.string(),
        average: z.number(),
        component_scores: z.record(z.string(), z.number()),
    })),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Grade = z.infer<typeof gradeSchema>;
export type GradeWithStudent = z.infer<typeof gradeWithStudentSchema>;
export type GradeWithSubject = z.infer<typeof gradeWithSubjectSchema>;
export type GradeWithRelations = z.infer<typeof gradeWithRelationsSchema>;
export type GradeStatistics = z.infer<typeof gradeStatisticsSchema>;
export type StudentGradeSummary = z.infer<typeof studentGradeSummarySchema>;
