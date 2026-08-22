import { z } from "zod";
import {
    createSortSchema,
    paginationWithDefaults,
    uuidSchema,
} from "../common";

// ============================================
// CLASS REQUEST SCHEMAS
// ============================================

/**
 * Class query parameters
 */
export const classQuerySchema = z.object({
    ...paginationWithDefaults(50).shape,
    ...createSortSchema(["name", "created_at"], "name").shape,
    search: z.string().optional(),
    teacher_id: uuidSchema.optional(),
    grade: z.string().optional(),
    academic_year_id: uuidSchema.optional(),
    status: z.enum(["active", "inactive", "completed"]).optional(),
});

/**
 * Class creation schema
 */
export const createClassSchema = z.object({
    name: z.string().min(1, "Class name is required").max(100),
    teacher_id: uuidSchema.optional().nullable(),
    subject_id: uuidSchema.optional().nullable(),
    room: z.string().max(50).optional().nullable(),
    schedule: z.string().max(200).optional().nullable(),
    capacity: z.number().int().positive().optional().default(40),
    academic_year_id: uuidSchema.optional().nullable(),
    status: z.enum(["active", "inactive", "completed"]).default("active"),
    days_of_week: z.array(z.number().min(0).max(6)).optional(),
    auto_schedule: z.boolean().optional(),
});

/**
 * Class update schema
 */
export const updateClassSchema = createClassSchema.partial();

export type ClassQueryInput = z.infer<typeof classQuerySchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
