/**
 * Reports Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { booleanStringSchema, dateStringSchema, uuidSchema, optionalUuidSchema } from '../common';

export const reportCardQuerySchema = z
  .object({
    studentId: uuidSchema,
    semesterId: optionalUuidSchema,
    academicYearId: optionalUuidSchema,
    dateFrom: dateStringSchema.optional(),
    dateTo: dateStringSchema.optional(),
  })
  .refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: 'dateFrom must be before or equal to dateTo',
    path: ['dateFrom'],
  });

export const transcriptQuerySchema = z.object({
  studentId: uuidSchema,
  includePending: booleanStringSchema,
  language: z.enum(['vi', 'en']).optional(),
});

export type ReportCardQuery = z.infer<typeof reportCardQuerySchema>;
export type TranscriptQuery = z.infer<typeof transcriptQuerySchema>;
