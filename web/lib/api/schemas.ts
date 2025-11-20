import { z } from 'zod';

/**
 * Common validation schemas using Zod
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Common field schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format').optional();

// Course schemas
export const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200),
  description: z.string().max(5000).optional(),
  code: z.string().min(1, 'Course code is required').max(50),
  subject_id: uuidSchema,
  credits: z.number().int().min(0).max(10).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseIdSchema = z.object({
  id: uuidSchema,
});

// Class schemas
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(200),
  course_id: uuidSchema,
  teacher_id: uuidSchema,
  academic_year_id: uuidSchema,
  schedule: z.string().max(500).optional(),
  room: z.string().max(100).optional(),
  capacity: z.number().int().min(1).optional(),
});

export const updateClassSchema = createClassSchema.partial();

// Student schemas
export const createStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: emailSchema,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  emergency_contact: z.string().max(200).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Assignment schemas
export const createAssignmentSchema = z.object({
  class_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  due_date: z.string().datetime('Invalid datetime format'),
  total_points: z.number().min(0).max(1000),
  category_id: uuidSchema.optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

// Grade schemas
export const createGradeSchema = z.object({
  assignment_id: uuidSchema,
  student_id: uuidSchema,
  points_earned: z.number().min(0),
  notes: z.string().max(1000).optional(),
});

export const updateGradeSchema = createGradeSchema.partial();

// Attendance schemas
export const createAttendanceSchema = z.object({
  class_id: uuidSchema,
  student_id: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
});

export const bulkAttendanceSchema = z.object({
  class_id: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  records: z.array(
    z.object({
      student_id: uuidSchema,
      status: z.enum(['present', 'absent', 'late', 'excused']),
      notes: z.string().max(500).optional(),
    })
  ),
});

// User schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(['admin', 'teacher', 'student']),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
});

// Export types
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
