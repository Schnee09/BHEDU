import { z } from "zod";
import {
    createSortSchema,
    dateStringSchema,
    enrollmentStatusSchema,
    paginationWithDefaults,
    uuidSchema,
} from "../common";

// ============================================
// ENROLLMENT REQUEST SCHEMAS
// ============================================

/**
 * Enrollment query parameters
 */
export const enrollmentQuerySchema = z.object({
    ...paginationWithDefaults(50).shape,
    ...createSortSchema(["enrolled_at", "created_at"], "enrolled_at").shape,
    class_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    status: z.enum(["active", "inactive", "enrolled", "withdrawn", "dropped", "completed", "all"])
        .optional(),
    academic_year_id: uuidSchema.optional(),
    from_date: dateStringSchema.optional(),
    to_date: dateStringSchema.optional(),
});

/**
 * Enrollment creation schema
 */
export const createEnrollmentSchema = z.object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    enrollment_date: dateStringSchema.optional(),
    status: enrollmentStatusSchema.optional().default("active"),
    notes: z.string().max(500).optional().nullable(),
});

/**
 * Enrollment update schema
 */
export const updateEnrollmentSchema = createEnrollmentSchema.partial().omit({
    student_id: true, // Cannot change student/class once created usually
    class_id: true,
});

/**
 * Bulk enrollment schema
 */
export const bulkEnrollmentSchema = z.object({
    class_id: uuidSchema,
    student_ids: z.array(uuidSchema).min(1, "At least one student required")
        .max(100),
    enrollment_date: dateStringSchema.optional(),
});

export type EnrollmentQueryInput = z.infer<typeof enrollmentQuerySchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>;
