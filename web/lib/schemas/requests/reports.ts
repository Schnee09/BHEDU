/**
 * Reports Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const reportCardQuerySchema = z.object({
    studentId: z.string().uuid(),
    semesterId: z.string().uuid().optional(),
    academicYearId: z.string().uuid().optional(),
});

export const transcriptQuerySchema = z.object({
    studentId: z.string().uuid(),
    includePending: z.boolean().optional(),
    language: z.enum(["vi", "en"]).optional(),
});

export type ReportCardQuery = z.infer<typeof reportCardQuerySchema>;
export type TranscriptQuery = z.infer<typeof transcriptQuerySchema>;
