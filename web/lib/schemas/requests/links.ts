/**
 * Links Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import { uuidSchema } from "../common";

/**
 * Schema for requesting a new link
 */
export const parentStudentLinkSchema = z.object({
    student_id: uuidSchema,
    parent_id: uuidSchema.optional(),
    relationship: z.enum(["father", "mother", "guardian", "other"]),
    status: z.enum(["pending", "approved", "rejected"]).optional().default(
        "pending",
    ),
});

/**
 * Schema for updating link status (admin/approval)
 */
export const updateLinkStatusSchema = z.object({
    id: uuidSchema,
    status: z.enum(["approved", "rejected"]),
    notes: z.string().max(500).optional(),
});

export type ParentStudentLinkInput = z.infer<typeof parentStudentLinkSchema>;
export type UpdateLinkStatusInput = z.infer<typeof updateLinkStatusSchema>;
