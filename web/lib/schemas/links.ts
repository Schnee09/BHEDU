/**
 * Validation schemas for Parent-Student Link requests
 */

import { z } from "zod";

/**
 * Schema for requesting a new link
 */
export const parentStudentLinkSchema = z.object({
    student_id: z.string().uuid("Invalid student ID"),
    parent_id: z.string().uuid("Invalid parent ID").optional(), // Optional if implicit from auth
    relationship: z.enum(["father", "mother", "guardian", "other"]),
    status: z.enum(["pending", "approved", "rejected"]).optional().default(
        "pending",
    ),
});

/**
 * Schema for updating link status (admin/approval)
 */
export const updateLinkStatusSchema = z.object({
    id: z.string().uuid("Invalid link ID"),
    status: z.enum(["approved", "rejected"]),
    notes: z.string().max(500).optional(),
});

export type ParentStudentLinkInput = z.infer<typeof parentStudentLinkSchema>;
export type UpdateLinkStatusInput = z.infer<typeof updateLinkStatusSchema>;
