/**
 * Common Validation Schemas
 * Shared schema helpers for pagination, sorting, and common fields
 */

import { z } from 'zod';

// ============================================
// PAGINATION
// ============================================

/**
 * Standard pagination schema
 */
export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('25').transform(Number),
});

/**
 * Extended pagination with better defaults
 */
export const paginationWithDefaults = (defaultLimit = 25) =>
  z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default(String(defaultLimit)).transform(Number),
  });

// ============================================
// SORTING
// ============================================

/**
 * Standard sort order
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).optional().default('desc');

/**
 * Create a sort schema with allowed fields
 */
export function createSortSchema<T extends readonly [string, ...string[]]>(
  allowedFields: T,
  defaultField: T[number] = 'created_at' as T[number]
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
export const optionalUuidSchema = z.string().uuid().optional().nullable();

/** Date string field (YYYY-MM-DD) */
export const dateStringSchema = z.string().date();

/** Optional date string field */
export const optionalDateStringSchema = z.string().date().optional().nullable();

/** Email field */
export const emailSchema = z.string().email('Invalid email format');

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
  .transform((val) => val === 'true');

// ============================================
// COMMON ENUMS
// ============================================

/** User roles */
export const userRoleSchema = z.enum(['student', 'teacher', 'staff', 'admin']);

/** Student status */
export const studentStatusSchema = z.enum(['active', 'inactive', 'graduated', 'suspended', 'transferred']);

/** Gender */
export const genderSchema = z.enum(['male', 'female', 'other']);

/** Semester */
export const semesterSchema = z.enum(['1', '2', 'final']);

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Create a standard list query schema with pagination
 */
export function createListQuerySchema<T extends z.ZodRawShape>(
  filters: T,
  sortFields: readonly [string, ...string[]] = ['created_at'],
  defaultLimit = 25
) {
  return z.object({
    ...paginationWithDefaults(defaultLimit).shape,
    ...createSortSchema(sortFields).shape,
    ...filters,
  });
}

// ============================================
// CLASSES SCHEMA
// ============================================

/**
 * Class query parameters
 */
export const classQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  search: z.string().optional(),
  teacher_id: z.string().uuid().optional(),
  grade: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
});

/**
 * Class creation schema
 */
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional().nullable(),
  teacher_id: z.string().uuid('Invalid teacher ID').optional().nullable(),
  grade: z.string().max(20).optional(),
  academic_year_id: z.string().uuid().optional().nullable(),
  max_students: z.number().int().positive().optional().default(40),
});

// ============================================
// ENROLLMENT SCHEMA
// ============================================

/**
 * Enrollment query parameters
 */
export const enrollmentQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  class_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  status: z.enum(['active', 'withdrawn', 'completed', 'all']).optional(),
  academic_year_id: z.string().uuid().optional(),
});

/**
 * Enrollment creation schema
 */
export const createEnrollmentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_id: z.string().uuid('Invalid class ID'),
  enrollment_date: z.string().date().optional(),
  status: z.enum(['active', 'withdrawn', 'completed']).optional().default('active'),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Bulk enrollment schema
 */
export const bulkEnrollmentSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  student_ids: z.array(z.string().uuid()).min(1, 'At least one student required').max(100),
  enrollment_date: z.string().date().optional(),
});

// ============================================
// ATTENDANCE SCHEMA
// ============================================

/**
 * Attendance query parameters
 */
export const attendanceQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  class_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  date: z.string().date().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  status: z.enum(['present', 'absent', 'late', 'excused', 'all']).optional(),
});

/**
 * Attendance record schema
 */
export const attendanceRecordSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  class_id: z.string().uuid('Invalid class ID'),
  date: z.string().date('Invalid date'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional().nullable(),
  excused_reason: z.string().max(200).optional().nullable(),
});

/**
 * Bulk attendance schema
 */
export const bulkAttendanceSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  date: z.string().date('Invalid date'),
  records: z.array(
    z.object({
      student_id: z.string().uuid('Invalid student ID'),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      notes: z.string().max(500).optional().nullable(),
    })
  ).min(1, 'At least one record required'),
});

// ============================================
// SUBJECT SCHEMA
// ============================================

/**
 * Subject query parameters
 */
export const subjectQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  search: z.string().optional(),
  department: z.string().optional(),
});

/**
 * Subject creation schema
 */
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional().nullable(),
  department: z.string().max(100).optional(),
  credits: z.number().int().min(0).optional().default(1),
  is_active: z.boolean().optional().default(true),
});
