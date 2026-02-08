/**
 * Links Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const parentStudentLinkResponseSchema = z.object({
    id: z.string().uuid(),
    student_id: z.string().uuid(),
    parent_id: z.string().uuid(),
    relationship: z.string(),
    status: z.enum(["pending", "approved", "rejected"]),
    created_at: z.string(),
    updated_at: z.string(),
});

export type ParentStudentLinkResponse = z.infer<
    typeof parentStudentLinkResponseSchema
>;
