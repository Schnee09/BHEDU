/**
 * Course Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { uuidSchema } from '../common';

export const courseResponseSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  credits: z.number(),
  subject_id: uuidSchema,
  status: z.enum(['active', 'inactive', 'archived']),
  created_at: z.string(),
  updated_at: z.string(),
  // Include joined subject if requested
  subject: z
    .object({
      id: uuidSchema,
      name: z.string(),
      code: z.string(),
    })
    .optional(),
});

export type CourseResponse = z.infer<typeof courseResponseSchema>;
