/**
 * Common Validation Schemas
 * Shared schema helpers for pagination, sorting, and common fields
 */

import { z } from "zod";

// ============================================
// PAGINATION
// ============================================

/**
 * Standard pagination schema
 */
export const paginationSchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("25").transform(Number),
});

/**
 * Extended pagination with better defaults
 */
export const paginationWithDefaults = (defaultLimit = 25) =>
  z.object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default(String(defaultLimit)).transform(
      Number,
    ),
  });

// ============================================
// SORTING
// ============================================

/**
 * Standard sort order
 */
export const sortOrderSchema = z.enum(["asc", "desc"]).optional().default(
  "desc",
);

/**
 * Create a sort schema with allowed fields
 */
export function createSortSchema<T extends readonly [string, ...string[]]>(
  allowedFields: T,
  defaultField: T[number] = "created_at" as T[number],
) {
  return z.object({
    sort: z.enum(allowedFields).optional().default(defaultField),
    order: sortOrderSchema,
  });
}

// ============================================
// COMMON FIELD SCHEMAS
// ============================================

/** UUID field */
export const uuidSchema = z.string().uuid();

/** Optional UUID field */
export const optionalUuidSchema = z
  .string()
  .uuid()
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform((val) => (val === "" ? null : val));

/** Date string field (YYYY-MM-DD) */
export const dateStringSchema = z.string().date();

/** Optional date string field */
export const optionalDateStringSchema = z.string().date().optional().nullable();

/** Timestamp schema (ISO 8601 datetime) */
export const timestampSchema = z.string().datetime();

/** Time string schema (HH:mm or HH:mm:ss) */
export const timeStringSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
  "Invalid time format (HH:mm)",
);

/** Email field */
export const emailSchema = z.string().email("Invalid email format");

/** Optional email field */
export const optionalEmailSchema = z.string().email().optional().nullable();

/** Phone field (max 20 chars) */
export const phoneSchema = z.string().max(20);

/** Optional phone field */
export const optionalPhoneSchema = z.string().max(20).optional().nullable();

/** Notes field (max 500 chars) */
export const notesSchema = z.string().max(500).optional().nullable();

/** Boolean from string */
export const booleanStringSchema = z
  .string()
  .optional()
  .transform((val) => (val === undefined ? undefined : val === "true"));

// ============================================
// COMMON ENUMS
// ============================================

/** User roles (matches database enum) */
export const userRoleSchema = z.enum([
  "super_admin",
  "owner",
  "admin",
  "staff",
  "teacher",
  "tutor",
  "parent",
  "student",
]);

/** Student status */
export const studentStatusSchema = z.enum([
  "active",
  "inactive",
  "graduated",
  "suspended",
  "transferred",
]);

/** Gender */
export const genderSchema = z.enum(["male", "female", "other"]);

/** Semester */
export const semesterSchema = z.string();

/** Grade component (matches database enum) */
export const gradeComponentSchema = z.enum([
  "oral",
  "fifteen_min",
  "one_period",
  "midterm",
  "final",
]);

/** Attendance status (matches database enum) */
export const attendanceStatusSchema = z.enum([
  "present",
  "absent",
  "late",
  "excused",
  "half_day",
]);

/** Enrollment status (matches database enum) */
export const enrollmentStatusSchema = z.enum([
  "enrolled",
  "completed",
  "dropped",
  "withdrawn",
]);

/** Invoice status (matches database enum) */
export const invoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "pending",
  "partial",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);

/** Payment status (matches database enum) */
export const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
  "received",
  "verified",
]);

/** Grade level (Vietnamese system) */
export const gradeLevelSchema = z.enum([
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
]).optional().nullable();

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Create a standard list query schema with pagination
 */
export function createListQuerySchema<T extends z.ZodRawShape>(
  filters: T,
  sortFields: readonly [string, ...string[]] = ["created_at"],
  defaultLimit = 25,
) {
  return z.object({
    ...paginationWithDefaults(defaultLimit).shape,
    ...createSortSchema(sortFields).shape,
    ...filters,
  });
}

// ============================================
// QUERY HELPERS
// ============================================
