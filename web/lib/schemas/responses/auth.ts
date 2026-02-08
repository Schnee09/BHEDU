/**
 * Auth Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const authResponseSchema = z.object({
    user: z.object({
        id: z.string().uuid(),
        email: z.string(),
        role: z.string(),
        full_name: z.string(),
    }),
    token: z.string().optional(),
    session_expires_at: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
