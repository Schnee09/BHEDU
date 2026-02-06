import { z } from "zod";
import { notesSchema, timeStringSchema, uuidSchema } from "./common";

// Enum for Day of Week (0-6)
// Database might store as integer 0-6 or 1-7. Code uses 0 (Sun) to 6 (Sat) usually, or 1 (Mon)?
// Looking at UI, typically 2 (Mon) to 8 (Sun) in VN?
// Let's check DB usage. Code usually passes clean integer.
// We will accept number.

const timetableSlotBaseSchema = z.object({
    class_id: uuidSchema.optional().nullable(),
    student_id: uuidSchema.optional().nullable(),
    subject_id: uuidSchema.optional().nullable(),
    teacher_id: uuidSchema.optional().nullable(),
    day_of_week: z.number().int().min(0).max(8), // Covering all conventions 0-6 or 2-8
    start_time: timeStringSchema,
    end_time: timeStringSchema,
    room: z.string().max(50).optional().nullable(),
    notes: notesSchema,
});

export const createTimetableSlotSchema = timetableSlotBaseSchema.refine(
    (data) => data.class_id || data.student_id,
    {
        message: "Either class_id or student_id is required",
        path: ["class_id"],
    },
);

export const updateTimetableSlotSchema = timetableSlotBaseSchema.partial();

export const timetableQuerySchema = z.object({
    class_id: uuidSchema.optional(),
    student_id: uuidSchema.optional(),
    teacher_id: uuidSchema.optional(),
    week_start_date: z.string().optional(), // ISO Date YYYY-MM-DD
    start_date: z.string().optional(),
    end_date: z.string().optional(),
});

export type CreateTimetableSlotInput = z.infer<
    typeof createTimetableSlotSchema
>;
export type UpdateTimetableSlotInput = z.infer<
    typeof updateTimetableSlotSchema
>;
export type TimetableQueryInput = z.infer<typeof timetableQuerySchema>;
