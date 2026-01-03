-- ============================================
-- BH-EDU DATABASE INDEXES FOR PERFORMANCE
-- Run this to optimize query performance
-- ============================================

-- ===========================================
-- Enable pg_trgm extension FIRST (for text search)
-- Note: May fail on Supabase - skip if error
-- ===========================================
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================
-- PROFILES TABLE INDEXES
-- ===========================================

-- Index for user_id lookups (auth integration)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON public.profiles(user_id);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON public.profiles(role);

-- Index for student queries with status
CREATE INDEX IF NOT EXISTS idx_profiles_role_status 
  ON public.profiles(role, status) 
  WHERE role = 'student';

-- Index for teacher lookups
CREATE INDEX IF NOT EXISTS idx_profiles_teachers 
  ON public.profiles(id) 
  WHERE role = 'teacher';

-- Index for name search (requires pg_trgm extension)
-- Uncomment if you have pg_trgm enabled:
-- CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm 
--   ON public.profiles 
--   USING gin (full_name gin_trgm_ops);

-- ===========================================
-- CLASSES TABLE INDEXES
-- ===========================================

-- Index for teacher's classes lookup
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id 
  ON public.classes(teacher_id);

-- Index for class name search
CREATE INDEX IF NOT EXISTS idx_classes_name 
  ON public.classes(name);

-- ===========================================
-- ENROLLMENTS TABLE INDEXES
-- ===========================================

-- Index for student's enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id 
  ON public.enrollments(student_id);

-- Index for class enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id 
  ON public.enrollments(class_id);

-- Composite index for active enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_class_status 
  ON public.enrollments(class_id, status) 
  WHERE status = 'active';

-- ===========================================
-- GRADES TABLE INDEXES
-- ===========================================

-- Index for student grades
CREATE INDEX IF NOT EXISTS idx_grades_student_id 
  ON public.grades(student_id);

-- Index for class grades
CREATE INDEX IF NOT EXISTS idx_grades_class_id 
  ON public.grades(class_id);

-- Index for subject grades
CREATE INDEX IF NOT EXISTS idx_grades_subject_id 
  ON public.grades(subject_id);

-- Composite index for grade queries
CREATE INDEX IF NOT EXISTS idx_grades_student_class_subject 
  ON public.grades(student_id, class_id, subject_id);

-- Index for semester filtering
CREATE INDEX IF NOT EXISTS idx_grades_semester 
  ON public.grades(semester);

-- ===========================================
-- ATTENDANCE TABLE INDEXES
-- ===========================================

-- Index for student attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id 
  ON public.attendance(student_id);

-- Index for class attendance
CREATE INDEX IF NOT EXISTS idx_attendance_class_id 
  ON public.attendance(class_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_date 
  ON public.attendance(date DESC);

-- Composite index for attendance reports
CREATE INDEX IF NOT EXISTS idx_attendance_class_date 
  ON public.attendance(class_id, date DESC);

-- ===========================================
-- ASSIGNMENTS TABLE INDEXES
-- (Uncomment when assignments table exists)
-- ===========================================

-- Index for class assignments
-- CREATE INDEX IF NOT EXISTS idx_assignments_class_id 
--   ON public.assignments(class_id);

-- Index for due date sorting
-- CREATE INDEX IF NOT EXISTS idx_assignments_due_date 
--   ON public.assignments(due_date DESC);

-- ===========================================
-- USER_PERMISSIONS TABLE INDEXES
-- ===========================================

-- Index for user permissions lookup
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
  ON public.user_permissions(user_id);

-- ===========================================
-- Enable pg_trgm extension for text search (if not exists)
-- Note: Skip this line on Supabase (requires superuser)
-- ===========================================
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================
-- ANALYZE TABLES for query optimizer
-- ===========================================
ANALYZE public.profiles;
ANALYZE public.classes;
ANALYZE public.enrollments;
ANALYZE public.grades;
ANALYZE public.attendance;
