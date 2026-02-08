/**
 * Subject Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const subjectResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    department: z.string().optional(),
    credits: z.number(),
    is_active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type SubjectResponse = z.infer<typeof subjectResponseSchema>;
