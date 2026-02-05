import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * Transcript Query Schema
 */
export const transcriptQuerySchema = z.object({
    studentId: uuidSchema,
    includePending: z.string().optional().transform((val) => val === "true"),
    language: z.enum(["vi", "en"]).optional().default("vi"),
});

export type TranscriptQueryInput = z.infer<typeof transcriptQuerySchema>;

export const reportCardQuerySchema = z.object({
    studentId: uuidSchema,
    semesterId: z.string().optional(), // 'HK1', 'HK2'
    academicYearId: uuidSchema.optional(),
});

export type ReportCardQueryInput = z.infer<typeof reportCardQuerySchema>;
