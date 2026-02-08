/**
 * Timetable Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

export const timetableQuerySchema = z.object({
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    student_id: z.string().uuid().optional(),
    room: z.string().optional(),
    week_start_date: z.string().optional(),
});

export const createTimetableSlotSchema = z.object({
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    student_id: z.string().uuid().optional(),
    subject_id: z.string().uuid(),
    room: z.string().optional(),
    day_of_week: z.number().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
    notes: z.string().optional(),
    is_active: z.boolean().optional(),
});

export const updateTimetableSlotSchema = createTimetableSlotSchema.partial();

export type TimetableQuery = z.infer<typeof timetableQuerySchema>;
export type CreateTimetableSlotInput = z.infer<
    typeof createTimetableSlotSchema
>;
export type UpdateTimetableSlotInput = z.infer<
    typeof updateTimetableSlotSchema
>;
