-- Migration: Schema Optimization V2
-- Created: 2026-02-01
-- Purpose: Add comprehensive indexes for performance and ensure consistent constraints.

-- 1. Profiles Improvements
-- Index for finding students by code efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code) WHERE role = 'student';
-- Index for filtering by grade level (common in lists)
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON public.profiles(grade_level) WHERE role = 'student';
-- Index for status filtering (e.g. Active students)
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
-- Index for role filtering (find all Teachers, all Students)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
-- Case-insensitive name search optimization
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower ON public.profiles(lower(full_name));

-- 2. Enrollments Performance
-- Optimize "Is student enrolled in class?" queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON public.enrollments(student_id, class_id);
-- Optimize "Get all active students in class" (filtering by status)
CREATE INDEX IF NOT EXISTS idx_enrollments_class_status ON public.enrollments(class_id, status);

-- 3. Grades Performance
-- Optimize fetching report card for a student
CREATE INDEX IF NOT EXISTS idx_grades_student_lookup ON public.grades(student_id);
-- Optimize fetching gradebook for a class subject
CREATE INDEX IF NOT EXISTS idx_grades_class_subject ON public.grades(class_id, subject_id);

-- 4. Attendance Performance
-- Optimize "Get student's attendance history"
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
-- Optimize "Get daily attendance for a class"
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);

-- 5. Timetable Slots Performance
-- Optimize "Teacher's Schedule"
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_v2 ON public.timetable_slots(teacher_id);
-- Optimize "Class Schedule"
CREATE INDEX IF NOT EXISTS idx_timetable_class_v2 ON public.timetable_slots(class_id);
-- Optimize "Student's Personal Schedule"
CREATE INDEX IF NOT EXISTS idx_timetable_student_v2 ON public.timetable_slots(student_id);
-- Optimize Conflict Detection (Room + Time)
CREATE INDEX IF NOT EXISTS idx_timetable_room_time ON public.timetable_slots(room, day_of_week, start_time, end_time);

-- 6. Finance Performance (Commented out as tables might be missing)
-- CREATE INDEX IF NOT EXISTS idx_invoices_student_status ON public.invoices(student_id, status);
-- CREATE INDEX IF NOT EXISTS idx_payments_student_date ON public.payments(student_id, payment_date);

