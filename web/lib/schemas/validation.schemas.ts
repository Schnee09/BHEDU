/**
 * Common Validation Schemas
 * 
 * Centralized Zod schemas for input validation across API routes.
 * Following DRY principle - define once, use everywhere.
 */

import { z } from 'zod'

// ============================================
// Common Field Validators
// ============================================

/**
 * UUID validator
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Date string validator (YYYY-MM-DD)
 */
export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
)

/**
 * Optional date string
 */
export const optionalDateSchema = dateSchema.optional().nullable()

/**
 * Email validator
 */
export const emailSchema = z.string().email('Invalid email address')

/**
 * Phone number validator
 */
export const phoneSchema = z.string()
  .max(20, 'Phone number too long')
  .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone format')
  .optional()
  .nullable()

/**
 * Non-empty name validator
 */
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .transform(s => s.trim())

// ============================================
// Pagination Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

export const searchSchema = z.object({
  search: z.string().max(100).optional()
})

// ============================================
// Student Schemas
// ============================================

export const studentStatusSchema = z.enum(['active', 'inactive', 'graduated', 'transferred'])

export const genderSchema = z.enum(['male', 'female', 'other'])

export const createStudentSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: optionalDateSchema,
  gender: genderSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergency_contact: z.string().max(100).optional().nullable(),
  grade_level: z.string().max(20).optional().nullable(),
  status: studentStatusSchema.default('active')
})

export const updateStudentSchema = createStudentSchema.partial()

export const studentQuerySchema = paginationSchema.merge(searchSchema).extend({
  status: studentStatusSchema.optional(),
  grade_level: z.string().optional(),
  gender: genderSchema.optional()
})

// ============================================
// Class Schemas
// ============================================

export const classStatusSchema = z.enum(['active', 'inactive', 'completed'])

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  course_id: uuidSchema.optional().nullable(),
  teacher_id: uuidSchema.optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  schedule: z.string().max(200).optional().nullable(),
  capacity: z.coerce.number().int().positive().max(100).optional().nullable(),
  academic_year_id: uuidSchema.optional().nullable(),
  status: classStatusSchema.default('active')
})

export const updateClassSchema = createClassSchema.partial()

export const classQuerySchema = paginationSchema.merge(searchSchema).extend({
  status: classStatusSchema.optional(),
  teacher_id: uuidSchema.optional(),
  course_id: uuidSchema.optional()
})

// ============================================
// Grade Schemas
// ============================================

export const gradeTypeSchema = z.enum([
  'oral',        // Kiểm tra miệng
  '15min',       // Kiểm tra 15 phút
  '45min',       // Kiểm tra 1 tiết
  'midterm',     // Giữa kỳ
  'final',       // Cuối kỳ
  'assignment',  // Bài tập
  'project'      // Dự án
])

export const createGradeSchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  category_id: uuidSchema.optional().nullable(),
  subject_id: uuidSchema.optional().nullable(),
  score: z.coerce.number().min(0).max(10),
  max_score: z.coerce.number().positive().default(10),
  weight: z.coerce.number().positive().default(1),
  grade_type: gradeTypeSchema.default('assignment'),
  notes: z.string().max(500).optional().nullable(),
  graded_at: dateSchema.optional()
})

export const updateGradeSchema = z.object({
  score: z.coerce.number().min(0).max(10).optional(),
  max_score: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional().nullable()
})

export const bulkGradeSchema = z.object({
  class_id: uuidSchema,
  grades: z.array(createGradeSchema.omit({ class_id: true })).min(1).max(100)
})

export const gradeQuerySchema = paginationSchema.extend({
  student_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  category_id: uuidSchema.optional(),
  grade_type: gradeTypeSchema.optional(),
  from_date: dateSchema.optional(),
  to_date: dateSchema.optional()
})

// ============================================
// Attendance Schemas
// ============================================

export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused'])

export const createAttendanceSchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  date: dateSchema,
  status: attendanceStatusSchema,
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable()
})

export const bulkAttendanceSchema = z.object({
  class_id: uuidSchema,
  date: dateSchema,
  records: z.array(z.object({
    student_id: uuidSchema,
    status: attendanceStatusSchema,
    notes: z.string().max(500).optional().nullable()
  })).min(1).max(100)
})

export const attendanceQuerySchema = paginationSchema.extend({
  student_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  date: dateSchema.optional(),
  from_date: dateSchema.optional(),
  to_date: dateSchema.optional(),
  status: attendanceStatusSchema.optional()
})

// ============================================
// Enrollment Schemas
// ============================================

export const enrollmentStatusSchema = z.enum(['active', 'inactive', 'completed', 'dropped'])

export const createEnrollmentSchema = z.object({
  student_id: uuidSchema,
  class_id: uuidSchema,
  enrollment_date: dateSchema.optional(),
  status: enrollmentStatusSchema.default('active'),
  notes: z.string().max(500).optional().nullable()
})

export const bulkEnrollSchema = z.object({
  class_id: uuidSchema,
  student_ids: z.array(uuidSchema).min(1).max(50),
  enrollment_date: dateSchema.optional()
})

export const enrollmentQuerySchema = paginationSchema.extend({
  student_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  status: enrollmentStatusSchema.optional()
})

// ============================================
// Type Exports
// ============================================

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type StudentQuery = z.infer<typeof studentQuerySchema>

export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
export type ClassQuery = z.infer<typeof classQuerySchema>

export type CreateGradeInput = z.infer<typeof createGradeSchema>
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>
export type BulkGradeInput = z.infer<typeof bulkGradeSchema>
export type GradeQuery = z.infer<typeof gradeQuerySchema>

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>
export type BulkEnrollInput = z.infer<typeof bulkEnrollSchema>
export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>
