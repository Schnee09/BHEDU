/**
 * Analytics Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const analyticsQuerySchema = z.object({
    academicYear: z.string().optional(),
    semester: z.string().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
