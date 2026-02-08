/**
 * Course Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const courseResponseSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    credits: z.number(),
    subject_id: z.string().uuid(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.string(),
    updated_at: z.string(),
    // Include joined subject if requested
    subject: z.object({
        id: z.string().uuid(),
        name: z.string(),
        code: z.string(),
    }).optional(),
});

export type CourseResponse = z.infer<typeof courseResponseSchema>;
