/**
 * Course Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import { paginationSchema, uuidSchema } from "../common";

export const courseIdSchema = z.string().uuid("Invalid course ID");

export const createCourseSchema = z.object({
    code: z.string().min(1, "Course code is required").max(20),
    name: z.string().min(1, "Course name is required").max(100),
    description: z.string().max(500).optional().nullable(),
    credits: z.number().int().min(1).max(10).default(1),
    subject_id: uuidSchema,
    status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseQuerySchema = paginationSchema.extend({
    status: z.enum(["active", "inactive", "archived"]).optional(),
    search: z.string().optional(),
    subjectId: z.string().uuid().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
