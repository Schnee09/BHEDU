/**
 * Student Request Schemas
 * Consolidated from lib/api/schemas.ts and lib/schemas/validation.schemas.ts
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import {
    dateStringSchema,
    emailSchema,
    genderSchema,
    gradeLevelSchema,
    optionalDateStringSchema,
    optionalPhoneSchema,
    paginationSchema,
    phoneSchema,
    studentStatusSchema,
    uuidSchema,
} from "../common";

// ============================================
// STUDENT CREATION
// ============================================

/**
 * Create student request schema
 */
export const createStudentSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100).optional(),
    last_name: z.string().min(1, "Last name is required").max(100).optional(),
    full_name: z.string().min(1, "Full name is required").max(200),
    email: z.string().email("Invalid email format").optional().nullable(),
    phone: optionalPhoneSchema,
    date_of_birth: optionalDateStringSchema,
    gender: genderSchema.optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    emergency_contact: z.string().max(100).optional().nullable(),
    grade_level: z.string().max(50).optional().nullable(),
    student_code: z.string()
        .regex(/^HS\d{8}$/, "Student code must be in format HS{YEAR}{4-DIGIT}")
        .optional(), // Auto-generated if not provided
    photo_url: z.string().url("Invalid photo URL").optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    enrollment_date: optionalDateStringSchema,
    status: studentStatusSchema.default("active"),
    is_active: z.boolean().optional().default(true),
    is_managed: z.boolean().optional().default(true),
});

// ============================================
// STUDENT UPDATE
// ============================================

/**
 * Update student request schema
 */
export const updateStudentSchema = createStudentSchema.partial().extend({
    id: uuidSchema.optional(),
});

// ============================================
// STUDENT QUERY
// ============================================

/**
 * Student query parameters
 */
export const studentQuerySchema = paginationSchema.extend({
    search: z.string().max(100).optional(),
    status: studentStatusSchema.optional(),
    grade_level: z.string().optional(),
    gender: genderSchema.optional(),
    class_id: uuidSchema.optional(), // Filter by class
    academic_year_id: uuidSchema.optional(), // Filter by academic year
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;

// ============================================
// GUARDIAN (Moved from legacy students.ts)
// ============================================

/**
 * Guardian creation schema
 */
export const createGuardianSchema = z.object({
    student_id: uuidSchema,
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().min(1, "Last name is required").max(100),
    relationship: z.enum(["father", "mother", "guardian", "other"]),
    phone: z.string().min(1, "Phone is required").max(20),
    email: emailSchema.optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    is_primary: z.boolean().optional().default(false),
});

// ============================================
// BULK IMPORT (Moved from legacy students.ts)
// ============================================

/**
 * Student bulk import schema
 */
export const importStudentsSchema = z.object({
    students: z.array(
        z.object({
            first_name: z.string().min(1),
            last_name: z.string().min(1),
            date_of_birth: dateStringSchema,
            gender: genderSchema,
            student_code: z.string().min(1),
            email: emailSchema.optional().nullable(),
            phone: z.string().optional().nullable(),
            address: z.string().optional().nullable(),
        }),
    ).min(1, "At least one student is required").max(
        100,
        "Maximum 100 students per import",
    ),
    class_id: uuidSchema.optional(),
    enrollment_date: dateStringSchema.optional(),
});
