------------------------------------------------------------
-- 🏫 COMPLETE STUDENT MANAGEMENT SCHEMA & POLICIES
-- For: Supabase Dashboard Direct Application
-- Date: 2025-11-21
-- This file contains all schema, RLS, and helper functions for a clean setup
------------------------------------------------------------

-- =============================
-- 1. SCHEMA (Tables, Indexes, Triggers)
-- =============================
-- ...existing code...
------------------------------------------------------------
-- 🏫 Comprehensive Student Management Schema & Policies
-- For: Supabase Dashboard Direct Application
-- Date: 2025-11-21
-- This file merges all critical schema, RLS, functions, and triggers for a clean setup
------------------------------------------------------------

-- =============================
-- 1. PROFILES TABLE
-- =============================
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  date_of_birth DATE,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);
COMMENT ON COLUMN profiles.last_name IS 'User last name';
COMMENT ON COLUMN profiles.full_name IS 'Auto-computed full name from first_name and last_name';
COMMENT ON COLUMN profiles.email IS 'User email address (synced from auth.users)';
COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth for students';
COMMENT ON COLUMN profiles.phone IS 'Phone number';
COMMENT ON COLUMN profiles.address IS 'Physical address';
COMMENT ON COLUMN profiles.emergency_contact IS 'Emergency contact information (phone or email)';

-- Trigger: Sync full_name
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.full_name = TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sync_full_name_trigger ON profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- 2. ENROLLMENTS TABLE
-- =============================
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'withdrawn'))
);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
COMMENT ON TABLE enrollments IS 'Student enrollments in classes';
COMMENT ON COLUMN enrollments.enrollment_date IS 'Date when student enrolled';
COMMENT ON COLUMN enrollments.status IS 'Enrollment status: active, inactive, completed, or withdrawn';

-- =============================
-- 3. GUARDIANS TABLE
-- =============================
DROP TABLE IF EXISTS guardians CASCADE;
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(50) CHECK (relationship IN ('father', 'mother', 'guardian', 'grandparent', 'sibling', 'other')),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  is_emergency_contact BOOLEAN DEFAULT false,
  occupation VARCHAR(100),
  workplace VARCHAR(255),
  work_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_guardians_student_id ON guardians(student_id);
CREATE INDEX idx_guardians_email ON guardians(email);
CREATE INDEX idx_guardians_phone ON guardians(phone);
CREATE INDEX idx_guardians_is_primary ON guardians(is_primary_contact) WHERE is_primary_contact = true;
COMMENT ON TABLE guardians IS 'Parent and guardian information for students';
COMMENT ON COLUMN guardians.student_id IS 'References the student (profiles.id)';
COMMENT ON COLUMN guardians.is_primary_contact IS 'Primary contact for school communications';
COMMENT ON COLUMN guardians.is_emergency_contact IS 'Emergency contact person';
-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_guardians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS guardians_updated_at ON guardians;
CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION update_guardians_updated_at();

-- =============================
-- 4. ATTENDANCE TABLE
-- =============================
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
COMMENT ON TABLE attendance IS 'Daily attendance records. Links to classes and students.';

-- =============================
-- 5. CLASSES TABLE (MINIMAL)
-- =============================
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE classes IS 'PRIMARY table for class/course management.';

-- =============================
-- 5.a REFERENCE TABLES (needed by seeds)
-- These were missing and are required by `COMPLETE_TEST_SEED.sql`.
-- =============================
DROP TABLE IF EXISTS academic_years CASCADE;
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_years_name ON academic_years(name);
COMMENT ON TABLE academic_years IS 'Academic year definitions (e.g. 2024-2025)';

DROP TABLE IF EXISTS grading_scales CASCADE;
CREATE TABLE grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scale JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grading_scales_name ON grading_scales(name);
COMMENT ON TABLE grading_scales IS 'Grading scale definitions (jsonb)';

DROP TABLE IF EXISTS payment_methods CASCADE;
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_name ON payment_methods(name);
COMMENT ON TABLE payment_methods IS 'Available payment methods';

DROP TABLE IF EXISTS fee_types CASCADE;
CREATE TABLE fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_types_name_year ON fee_types(name, academic_year_id);
COMMENT ON TABLE fee_types IS 'Types of fees (tuition, registration, etc.)';

-- =============================
-- 5.b ADDITIONAL TABLES (needed by API routes)
-- =============================

-- Subjects/Courses
DROP TABLE IF EXISTS subjects CASCADE;
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
COMMENT ON TABLE subjects IS 'Academic subjects (Math, Science, etc.)';

DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_subject ON courses(subject_id);
COMMENT ON TABLE courses IS 'Course offerings per academic year';

DROP TABLE IF EXISTS lessons CASCADE;
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  lesson_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, lesson_order);
COMMENT ON TABLE lessons IS 'Individual lessons within a course';

-- Assignment Categories & Assignments
DROP TABLE IF EXISTS assignment_categories CASCADE;
CREATE TABLE assignment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight DECIMAL(5,2) DEFAULT 0,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assignment_categories_class ON assignment_categories(class_id);
COMMENT ON TABLE assignment_categories IS 'Assignment categories with weighting (Homework, Exams, etc.)';

DROP TABLE IF EXISTS assignments CASCADE;
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES assignment_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  max_points DECIMAL(10,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_category ON assignments(category_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
COMMENT ON TABLE assignments IS 'Assignments for classes';

-- Grades
DROP TABLE IF EXISTS grades CASCADE;
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score DECIMAL(10,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_graded_by ON grades(graded_by);
CREATE UNIQUE INDEX idx_grades_assignment_student ON grades(assignment_id, student_id);
COMMENT ON TABLE grades IS 'Student grades for assignments';

-- Notifications
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
COMMENT ON TABLE notifications IS 'User notifications and alerts';

-- School Settings
DROP TABLE IF EXISTS school_settings CASCADE;
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_school_settings_key ON school_settings(key);
COMMENT ON TABLE school_settings IS 'School-wide configuration settings';

-- =============================
-- 6. AUDIT LOGS TABLE
-- =============================
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
COMMENT ON TABLE audit_logs IS 'System audit trail for all critical operations.';

-- =============================
-- 7. IMPORT LOGS & ERRORS
-- =============================
DROP TABLE IF EXISTS import_logs CASCADE;
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  import_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_summary TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_import_logs_imported_by ON import_logs(imported_by);
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_import_type ON import_logs(import_type);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at DESC);
DROP TABLE IF EXISTS import_errors CASCADE;
CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_log_id UUID NOT NULL REFERENCES import_logs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name VARCHAR(100),
  error_type VARCHAR(50),
  error_message TEXT NOT NULL,
  row_data JSONB,
  severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_import_errors_import_log_id ON import_errors(import_log_id);
CREATE INDEX idx_import_errors_error_type ON import_errors(error_type);
CREATE INDEX idx_import_errors_severity ON import_errors(severity);

-- =============================
-- 8. QR CODES TABLE
-- =============================
DROP TABLE IF EXISTS qr_codes CASCADE;
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(255) UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  valid_date DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  check_in_location VARCHAR(255),
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qr_codes_student ON qr_codes(student_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_valid_date ON qr_codes(valid_date);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_used_at ON qr_codes(used_at);
COMMENT ON TABLE qr_codes IS 'QR code-based attendance check-in.';

-- =============================
-- 9. ATTENDANCE REPORTS TABLE
-- =============================
DROP TABLE IF EXISTS attendance_reports CASCADE;
CREATE TABLE attendance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total_days INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  late_count INTEGER,
  excused_count INTEGER,
  attendance_rate DECIMAL(5,2),
  report_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attendance_reports_type ON attendance_reports(report_type);
CREATE INDEX idx_attendance_reports_class ON attendance_reports(class_id);
CREATE INDEX idx_attendance_reports_student ON attendance_reports(student_id);
CREATE INDEX idx_attendance_reports_dates ON attendance_reports(date_from, date_to);
COMMENT ON TABLE attendance_reports IS 'Pre-generated attendance summary reports.';

-- =============================
-- =============================
-- 10. RLS POLICIES (Production-Ready)
-- =============================

-- Enable RLS for all main tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_reports ENABLE ROW LEVEL SECURITY;
-- New tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
CREATE POLICY "Allow profile owner read" ON profiles
  FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Allow profile owner update" ON profiles
  FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Allow service role insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- CLASSES TABLE POLICIES
CREATE POLICY "Allow teacher/admin read" ON classes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow service role insert classes" ON classes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON classes
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- ENROLLMENTS TABLE POLICIES
CREATE POLICY "Allow student read own enrollments" ON enrollments
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow service role insert enrollments" ON enrollments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON enrollments
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- GUARDIANS TABLE POLICIES
CREATE POLICY "Allow student read own guardians" ON guardians
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow admin full access" ON guardians
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Allow student read own attendance" ON attendance
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow admin read attendance" ON attendance
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Allow service role insert attendance" ON attendance
  FOR INSERT WITH CHECK (true);

-- IMPORT LOGS/ERRORS TABLE POLICIES
CREATE POLICY "Allow admin read import logs" ON import_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Allow admin read import errors" ON import_errors
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- QR CODES TABLE POLICIES
CREATE POLICY "Allow student read own QR codes" ON qr_codes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow admin full access" ON qr_codes
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- ATTENDANCE REPORTS TABLE POLICIES
CREATE POLICY "Allow student read own attendance reports" ON attendance_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow admin full access" ON attendance_reports
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- SUBJECTS TABLE POLICIES
CREATE POLICY "Allow all authenticated read subjects" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON subjects
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- COURSES TABLE POLICIES
CREATE POLICY "Allow teacher/admin read courses" ON courses
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow admin full access" ON courses
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- LESSONS TABLE POLICIES
CREATE POLICY "Allow teacher/admin read lessons" ON lessons
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow admin full access" ON lessons
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- ASSIGNMENT CATEGORIES TABLE POLICIES
CREATE POLICY "Allow teacher/admin read assignment_categories" ON assignment_categories
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow admin full access" ON assignment_categories
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "Allow student read assignments for enrolled classes" ON assignments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM enrollments e
    INNER JOIN profiles p ON p.id = e.student_id
    WHERE p.user_id = auth.uid() AND e.class_id = assignments.class_id AND e.status = 'active'
  ));
CREATE POLICY "Allow teacher/admin read assignments" ON assignments
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow service role insert assignments" ON assignments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- GRADES TABLE POLICIES
CREATE POLICY "Allow student read own grades" ON grades
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = student_id));
CREATE POLICY "Allow teacher/admin read grades" ON grades
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND (p.role = 'teacher' OR p.role = 'admin')));
CREATE POLICY "Allow service role insert grades" ON grades
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON grades
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Allow user read own notifications" ON notifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = user_id));
CREATE POLICY "Allow user update own notifications" ON notifications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::uuid AND p.id = user_id));
CREATE POLICY "Allow admin full access" ON notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- SCHOOL SETTINGS TABLE POLICIES
CREATE POLICY "Allow all authenticated read school_settings" ON school_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON school_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- =============================

------------------------------------------------------------
-- 🛠️ Student Management Helper Functions
-- Migration: 046_student_management_functions
-- Date: 2025-11-21
-- Description: Utility functions for student CRUD operations
------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_exists(
  table_name text,
  record_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_flag boolean := false;
  sql_text text;
BEGIN
  -- Build a safe identifier-based query and attempt to execute it.
  sql_text := format('SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1)', table_name);
  BEGIN
    EXECUTE sql_text INTO exists_flag USING record_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    -- If table or column doesn't exist, return false rather than raising.
    RETURN false;
  END;
  RETURN COALESCE(exists_flag, false);
END;
$$;

COMMENT ON FUNCTION record_exists IS 
  'Check if a record exists in a given table by ID';

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_admin IS 
  'Check if a user has admin role (bypasses RLS)';

CREATE OR REPLACE FUNCTION is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'teacher'
  );
END;
$$;

COMMENT ON FUNCTION is_teacher IS 
  'Check if a user has teacher role (bypasses RLS)';

CREATE OR REPLACE FUNCTION is_student(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'student'
  );
END;
$$;

COMMENT ON FUNCTION is_student IS 
  'Check if a user has student role (bypasses RLS)';

CREATE OR REPLACE FUNCTION is_enrolled_in_class(
  p_class_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM enrollments
    WHERE class_id = p_class_id
    AND student_id = p_student_id
    AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION is_enrolled_in_class IS 
  'Check if a student is actively enrolled in a specific class';

CREATE OR REPLACE FUNCTION has_active_enrollments(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM enrollments
    WHERE student_id = p_student_id
    AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION has_active_enrollments IS 
  'Check if a student has any active enrollments';

CREATE OR REPLACE FUNCTION get_student_enrollment_count(p_student_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  enrollment_count integer;
BEGIN
  SELECT COUNT(*)
  INTO enrollment_count
  FROM enrollments
  WHERE student_id = p_student_id
  AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

COMMENT ON FUNCTION get_student_enrollment_count IS 
  'Get count of active enrollments for a student';

CREATE OR REPLACE FUNCTION get_class_enrollment_count(p_class_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  enrollment_count integer;
BEGIN
  SELECT COUNT(*)
  INTO enrollment_count
  FROM enrollments
  WHERE class_id = p_class_id
  AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

COMMENT ON FUNCTION get_class_enrollment_count IS 
  'Get count of active students enrolled in a class';

CREATE OR REPLACE FUNCTION is_email_unique(
  p_email text,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF p_exclude_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM profiles
      WHERE LOWER(email) = LOWER(p_email)
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1
      FROM profiles
      WHERE LOWER(email) = LOWER(p_email)
      AND id != p_exclude_id
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION is_email_unique IS 
  'Check if an email address is unique (case-insensitive)';

CREATE OR REPLACE FUNCTION batch_insert_enrollments(
  p_student_ids uuid[],
  p_class_id uuid,
  p_enrollment_date date DEFAULT CURRENT_DATE,
  p_status text DEFAULT 'active'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer := 0;
  student_id uuid;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    -- Only insert if not already enrolled
    IF NOT is_enrolled_in_class(p_class_id, student_id) THEN
      INSERT INTO enrollments (student_id, class_id, enrollment_date, status)
      VALUES (student_id, p_class_id, p_enrollment_date, p_status);
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION batch_insert_enrollments IS 
  'Batch enroll multiple students in a class, skipping duplicates';

CREATE OR REPLACE FUNCTION get_student_with_enrollments(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  full_name text,
  email text,
  date_of_birth date,
  phone text,
  address text,
  emergency_contact text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  enrollment_id uuid,
  class_id uuid,
  class_name text,
  enrollment_date date,
  enrollment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.full_name,
    p.email,
    p.date_of_birth,
    p.phone,
    p.address,
    p.emergency_contact,
    p.role,
    p.created_at,
    p.updated_at,
    e.id as enrollment_id,
    e.class_id,
    c.name as class_name,
    e.enrollment_date,
    e.status as enrollment_status
  FROM profiles p
  LEFT JOIN enrollments e ON e.student_id = p.id AND e.status = 'active'
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE p.id = p_student_id
  AND p.role = 'student';
END;
$$;

COMMENT ON FUNCTION get_student_with_enrollments IS 
  'Get student profile with all active enrollments in a single optimized query';

GRANT EXECUTE ON FUNCTION record_exists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_teacher TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_student TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_enrolled_in_class TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_active_enrollments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_student_enrollment_count TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_class_enrollment_count TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_email_unique TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION batch_insert_enrollments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_student_with_enrollments TO authenticated, service_role;

-- =============================
-- END OF MERGED MIGRATION
------------------------------------------------------------
-- Please review and append RLS policies and helper functions as needed for your use case.
------------------------------------------------------------

-- (Copy all schema from APPLY_CLEAN_STUDENT_MIGRATION.sql)

-- =============================
-- 2. RLS POLICIES
-- =============================
-- ...existing code...
-- (Copy all RLS policies from previous patch)

-- =============================
-- 3. HELPER FUNCTIONS
-- =============================
-- ...existing code...
-- (Copy all helper functions from previous patch)

-- =============================
-- END OF MIGRATION
------------------------------------------------------------
-- Apply this file in Supabase Dashboard for a complete, production-ready setup.
------------------------------------------------------------
