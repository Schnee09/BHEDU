/**
 * Reports Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { uuidSchema, optionalUuidSchema } from '../common';

export const reportCardQuerySchema = z.object({
  studentId: uuidSchema,
  semesterId: optionalUuidSchema,
  academicYearId: optionalUuidSchema,
});

export const transcriptQuerySchema = z.object({
  studentId: uuidSchema,
  includePending: z.boolean().optional(),
  language: z.enum(['vi', 'en']).optional(),
});

export type ReportCardQuery = z.infer<typeof reportCardQuerySchema>;
export type TranscriptQuery = z.infer<typeof transcriptQuerySchema>;
