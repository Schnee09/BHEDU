/**
 * Database Type Definitions
 * Auto-generated from schema: COMPLETE_STUDENT_MANAGEMENT.sql
 * 
 * This file provides type safety between the database schema and application code.
 * Update this file whenever the database schema changes.
 */

// =============================
// Core Tables
// =============================

export interface Profile {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null; // ISO date string
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  role: 'admin' | 'teacher' | 'student' | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string; // Note: API maps this to 'title' for frontend
  description: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  lesson_order: number; // Note: Not 'order_index'
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  academic_year_id?: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'completed' | 'withdrawn';
}

export interface Guardian {
  id: string;
  student_id: string;
  name: string;
  relationship: 'father' | 'mother' | 'guardian' | 'grandparent' | 'sibling' | 'other' | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  occupation: string | null;
  workplace: string | null;
  work_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day' | null;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

export interface AssignmentCategory {
  id: string;
  name: string;
  weight: number;
  class_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  max_points: number;
  created_at: string;
  updated_at: string;
}

export interface GradingScale {
  id: string;
  name: string;
  description: string | null;
  scale: Array<{ min: number; max: number; grade: string; gpa?: number }> | string; // JSONB - can be string or parsed
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeType {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  is_active: boolean;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================
// API Response Mapping Helpers
// =============================

/**
 * Maps database Course to API Course (name -> title)
 */
export function mapCourseToAPI(course: Course): Course & { title: string } {
  return {
    ...course,
    title: course.name
  };
}

/**
 * Maps API Course to database Course (title -> name)
 */
export function mapCourseFromAPI(apiCourse: { title: string } & Partial<Course>): Partial<Course> {
  const { title, ...rest } = apiCourse;
  return {
    ...rest,
    name: title
  };
}

/**
 * Parses JSONB grading scale if it's a string
 */
export function parseGradingScale(scale: GradingScale): GradingScale & { scale: Array<{ min: number; max: number; grade: string; gpa?: number }> } {
  return {
    ...scale,
    scale: typeof scale.scale === 'string' ? JSON.parse(scale.scale) : scale.scale
  };
}

// =============================
// Type Guards
// =============================

export function isProfile(obj: unknown): obj is Profile {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'role' in obj;
}

export function isCourse(obj: unknown): obj is Course {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj && 'teacher_id' in obj;
}

export function isLesson(obj: unknown): obj is Lesson {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'course_id' in obj && 'lesson_order' in obj;
}

// =============================
// Supabase Query Helpers
// =============================

/**
 * Type-safe column selections for each table
 */
export const TableColumns = {
  profiles: 'id, user_id, first_name, last_name, full_name, email, date_of_birth, phone, address, emergency_contact, role, created_at, updated_at',
  academic_years: 'id, name, start_date, end_date, is_current, created_at, updated_at',
  subjects: 'id, name, code, description, created_at, updated_at',
  courses: 'id, name, description, subject_id, teacher_id, academic_year_id, created_at, updated_at',
  lessons: 'id, course_id, title, content, lesson_order, created_at, updated_at',
  classes: 'id, name, teacher_id, created_at',
  enrollments: 'id, student_id, class_id, enrollment_date, status',
  guardians: 'id, student_id, name, relationship, phone, email, address, is_primary_contact, is_emergency_contact, occupation, workplace, work_phone, notes, created_at, updated_at',
  attendance: 'id, student_id, class_id, date, status, check_in_time, check_out_time, notes, marked_by, created_at',
  assignment_categories: 'id, name, weight, class_id, created_at, updated_at',
  assignments: 'id, class_id, category_id, title, description, due_date, max_points, created_at, updated_at',
  grading_scales: 'id, name, description, scale, is_default, created_at, updated_at',
  fee_types: 'id, name, description, amount, is_active, academic_year_id, created_at, updated_at',
  payment_methods: 'id, name, type, description, is_active, created_at, updated_at'
} as const;

/**
 * Foreign key relationships for type-safe joins
 */
export const ForeignKeys = {
  classes: {
    teacher: 'classes_teacher_id_fkey',
    academic_year: 'classes_academic_year_id_fkey'
  },
  courses: {
    subject: 'courses_subject_id_fkey',
    teacher: 'courses_teacher_id_fkey',
    academic_year: 'courses_academic_year_id_fkey'
  },
  lessons: {
    course: 'lessons_course_id_fkey'
  },
  enrollments: {
    student: 'enrollments_student_id_fkey',
    class: 'enrollments_class_id_fkey'
  }
} as const;
