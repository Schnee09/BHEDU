/**
 * Subject Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

/**
 * Subject query parameters
 */
export const subjectQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default("50").transform(Number),
    search: z.string().optional(),
    department: z.string().optional(),
});

/**
 * Subject creation schema
 */
export const createSubjectSchema = z.object({
    name: z.string().min(1, "Subject name is required").max(100),
    code: z.string().min(1, "Subject code is required").max(20),
    description: z.string().max(500).optional().nullable(),
    department: z.string().max(100).optional(),
    credits: z.number().int().min(0).optional().default(1),
    is_active: z.boolean().optional().default(true),
});

/**
 * Subject update schema
 */
export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type SubjectQuery = z.infer<typeof subjectQuerySchema>;
