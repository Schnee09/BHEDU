/**
 * Validation schemas for Student-related API requests
 */

import { z } from 'zod';

/**
 * Student creation schema
 */
export const createStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().min(1, 'Last name is required').max(100).optional(),
  full_name: z.string().min(1, 'Full name is required').max(200),
  date_of_birth: z.string().date('Invalid date format').optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  student_code: z.string().min(1, 'Student code is required').max(50).optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  grade_level: z.string().max(50).optional().nullable(),
  photo_url: z.string().url('Invalid photo URL').optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  enrollment_date: z.string().date('Invalid enrollment date').optional().nullable(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']).optional().default('active'),
  is_active: z.boolean().optional().default(true),
});

/**
 * Student update schema (all fields optional except ID)
 */
export const updateStudentSchema = z.object({
  id: z.string().uuid('Invalid student ID format'),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  full_name: z.string().min(1).max(200).optional(),
  date_of_birth: z.string().date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  student_code: z.string().min(1).max(50).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  grade_level: z.string().max(50).optional().nullable(),
  photo_url: z.string().url('Invalid photo URL').optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  enrollment_date: z.string().date().optional().nullable(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Student query parameters schema
 */
export const studentQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('25').transform(Number),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'all']).optional(),
  class_id: z.string().uuid().optional(),
  grade_level: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  sort: z.enum(['name', 'student_code', 'enrollment_date', 'created_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Guardian creation schema
 */
export const createGuardianSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  relationship: z.enum(['father', 'mother', 'guardian', 'other']),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email('Invalid email format').optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  is_primary: z.boolean().optional().default(false),
});

/**
 * Student bulk import schema
 */
export const importStudentsSchema = z.object({
  students: z.array(
    z.object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      date_of_birth: z.string().date(),
      gender: z.enum(['male', 'female', 'other']),
      student_code: z.string().min(1),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    })
  ).min(1, 'At least one student is required').max(100, 'Maximum 100 students per import'),
  class_id: z.string().uuid().optional(),
  enrollment_date: z.string().date().optional(),
});
