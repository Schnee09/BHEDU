/**
 * Timetable Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { optionalUuidSchema } from '../common';

export const timetableQuerySchema = z.object({
  class_id: optionalUuidSchema,
  teacher_id: optionalUuidSchema,
  student_id: optionalUuidSchema,
  room: z.string().optional(),
  week_start_date: z.string().optional(),
});

export const createTimetableSlotSchema = z.object({
  class_id: optionalUuidSchema,
  teacher_id: optionalUuidSchema,
  student_id: optionalUuidSchema,
  subject_id: optionalUuidSchema,
  room: z.string().nullish(),
  day_of_week: z.number().min(0).max(6).optional(),
  days_of_week: z.array(z.number().min(0).max(6)).optional(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullish(),
  is_active: z.boolean().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'makeup']).optional(),
});

export const updateTimetableSlotSchema = createTimetableSlotSchema.partial();

export type TimetableQuery = z.infer<typeof timetableQuerySchema>;
export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;
export type UpdateTimetableSlotInput = z.infer<typeof updateTimetableSlotSchema>;
