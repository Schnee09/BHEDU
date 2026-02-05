/**
 * Student Response Schemas
 * Defines the shape of student data returned from APIs
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import {
    dateStringSchema,
    emailSchema,
    genderSchema,
    gradeLevelSchema,
    studentStatusSchema,
    timestampSchema,
    uuidSchema,
} from "../common";

// ============================================
// STUDENT RESPONSE
// ============================================

/**
 * Base student response schema
 */
export const studentSchema = z.object({
    id: uuidSchema,
    user_id: uuidSchema,
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    gender: genderSchema.nullable(),
    address: z.string().nullable(),
    emergency_contact: z.string().nullable(),
    grade_level: z.string().nullable(),
    student_code: z.string(),
    status: studentStatusSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
});

// ============================================
// STUDENT WITH RELATIONS
// ============================================

/**
 * Student with enrollment information
 */
export const studentWithEnrollmentsSchema = studentSchema.extend({
    enrollments: z.array(z.object({
        id: uuidSchema,
        class_id: uuidSchema,
        class_name: z.string(),
        class_code: z.string().optional(),
        status: z.string(),
        enrollment_date: z.string().optional(),
    })).optional(),
});

/**
 * Student with parent links
 */
export const studentWithParentsSchema = studentSchema.extend({
    parent_links: z.array(z.object({
        id: uuidSchema,
        parent_id: uuidSchema,
        parent_name: z.string(),
        parent_email: z.string().email(),
        relationship: z.string(),
        status: z.string(),
    })).optional(),
});

/**
 * Student with full relations (enrollments + parents)
 */
export const studentWithRelationsSchema = studentSchema.extend({
    enrollments: z.array(z.object({
        id: uuidSchema,
        class_id: uuidSchema,
        class_name: z.string(),
        class_code: z.string().optional(),
        status: z.string(),
        enrollment_date: z.string().optional(),
    })).optional(),
    parent_links: z.array(z.object({
        id: uuidSchema,
        parent_id: uuidSchema,
        parent_name: z.string(),
        parent_email: z.string().email(),
        relationship: z.string(),
        status: z.string(),
    })).optional(),
});

/**
 * Student with academic performance
 */
export const studentWithPerformanceSchema = studentSchema.extend({
    performance: z.object({
        gpa: z.number().optional(),
        total_subjects: z.number().int(),
        attendance_rate: z.number().optional(),
        total_absences: z.number().int().optional(),
    }).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Student = z.infer<typeof studentSchema>;
export type StudentWithEnrollments = z.infer<
    typeof studentWithEnrollmentsSchema
>;
export type StudentWithParents = z.infer<typeof studentWithParentsSchema>;
export type StudentWithRelations = z.infer<typeof studentWithRelationsSchema>;
export type StudentWithPerformance = z.infer<
    typeof studentWithPerformanceSchema
>;
