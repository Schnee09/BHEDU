/**
 * Analytics Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const analyticsResponseSchema = z.object({
    summary: z.record(z.string(), z.any()),
    charts: z.record(z.string(), z.any()).optional(),
    generated_at: z.string(),
});

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
