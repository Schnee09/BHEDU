/**
 * Links Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { uuidSchema } from '../common';

export const parentStudentLinkResponseSchema = z.object({
  id: uuidSchema,
  student_id: uuidSchema,
  parent_id: uuidSchema,
  relationship: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ParentStudentLinkResponse = z.infer<typeof parentStudentLinkResponseSchema>;
