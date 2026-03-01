import { z } from "zod";
import {
    attendanceStatusSchema,
    createSortSchema,
    dateStringSchema,
    optionalUuidSchema,
    paginationWithDefaults,
    uuidSchema,
} from "../common";

// ============================================
// ATTENDANCE REQUEST SCHEMAS
// ============================================

/**
 * Attendance query parameters
 */
export const attendanceQuerySchema = z.object({
    ...paginationWithDefaults(50).shape,
    ...createSortSchema(["date", "created_at"], "date").shape,
    class_id: optionalUuidSchema,
    student_id: optionalUuidSchema,
    date: dateStringSchema.optional(),
    start_date: dateStringSchema.optional(),
    end_date: dateStringSchema.optional(),
    status: z.enum(["present", "absent", "late", "excused", "all"]).optional(),
    from_date: dateStringSchema.optional(),
    to_date: dateStringSchema.optional(),
});

/**
 * Attendance record schema
 */
export const attendanceRecordSchema = z.object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    date: dateStringSchema,
    status: attendanceStatusSchema,
    notes: z.string().max(500).optional().nullable(),
    excused_reason: z.string().max(200).optional().nullable(),
});

/**
 * Create/Update Attendance Schema
 */
export const createAttendanceSchema = attendanceRecordSchema;
export const updateAttendanceSchema = attendanceRecordSchema.partial().omit({
    student_id: true,
    class_id: true,
    date: true,
});

/**
 * Bulk attendance schema
 */
export const bulkAttendanceSchema = z.object({
    class_id: uuidSchema,
    date: dateStringSchema,
    records: z.array(
        z.object({
            student_id: uuidSchema,
            status: attendanceStatusSchema,
            notes: z.string().max(500).optional().nullable(),
        }),
    ).min(1, "At least one record required"),
    marked_by: z.string().optional(),
});

export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
