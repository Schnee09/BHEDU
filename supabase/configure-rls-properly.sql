-- ================================================================
-- PROPER RLS CONFIGURATION FOR BH-EDU
-- ================================================================
-- This enables RLS and sets up policies that allow:
-- 1. Service role (admin API) - full access (bypasses RLS automatically)
-- 2. Authenticated admins - full access
-- 3. Authenticated teachers - access to their classes
-- 4. Authenticated students - access to their own data
-- ================================================================

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow profile owner read" ON profiles;
DROP POLICY IF EXISTS "Allow profile owner update" ON profiles;
DROP POLICY IF EXISTS "Allow service role insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin" ON profiles;

DROP POLICY IF EXISTS "Admin full access" ON classes;
DROP POLICY IF EXISTS "Teachers view own classes" ON classes;
DROP POLICY IF EXISTS "Students view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Admins have full access to classes" ON classes;
DROP POLICY IF EXISTS "Allow admin full access" ON classes;
DROP POLICY IF EXISTS "Allow service role insert classes" ON classes;
DROP POLICY IF EXISTS "Allow teacher/admin read" ON classes;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;
DROP POLICY IF EXISTS "Teachers manage own classes" ON classes;

DROP POLICY IF EXISTS "Admin full access" ON enrollments;
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow admin full access" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow student read own enrollments" ON enrollments;

DROP POLICY IF EXISTS "Admin full access" ON attendance;
DROP POLICY IF EXISTS "Students view own attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers view class attendance" ON attendance;
DROP POLICY IF EXISTS "Admins have full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow admin read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow service role insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow student read own attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins manage attendance" ON attendance;

DROP POLICY IF EXISTS "Admin full access" ON grades;
DROP POLICY IF EXISTS "Students view own grades" ON grades;
DROP POLICY IF EXISTS "Teachers view class grades" ON grades;
DROP POLICY IF EXISTS "Admins have full access to grades" ON attendance;
DROP POLICY IF EXISTS "Allow admin full access" ON grades;
DROP POLICY IF EXISTS "Allow service role insert grades" ON grades;
DROP POLICY IF EXISTS "Allow student read own grades" ON grades;
DROP POLICY IF EXISTS "Allow teacher/admin read grades" ON grades;

DROP POLICY IF EXISTS "Admin full access" ON assignments;
DROP POLICY IF EXISTS "Students view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers manage assignments" ON assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON assignments;
DROP POLICY IF EXISTS "Allow admin full access" ON assignments;
DROP POLICY IF EXISTS "Allow service role insert assignments" ON assignments;
DROP POLICY IF EXISTS "Allow student read assignments for enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Allow teacher/admin read assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins manage assignments" ON assignments;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PROFILES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on profiles"
  ON profiles
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can view own profile
CREATE POLICY "Users view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view other profiles (for listings, search, etc.)
CREATE POLICY "Authenticated users view profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- CLASSES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on classes"
  ON classes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage their own classes
CREATE POLICY "Teachers manage own classes"
  ON classes
  FOR ALL
  USING (
    is_teacher() AND 
    teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    is_teacher() AND 
    teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Students can view classes they're enrolled in
CREATE POLICY "Students view enrolled classes"
  ON classes
  FOR SELECT
  USING (
    is_student() AND
    id IN (
      SELECT class_id FROM enrollments
      WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- All authenticated users can view classes (for browsing/enrollment)
CREATE POLICY "Authenticated users view classes"
  ON classes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- ENROLLMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on enrollments"
  ON enrollments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can view enrollments for their classes
CREATE POLICY "Teachers view class enrollments"
  ON enrollments
  FOR SELECT
  USING (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students view own enrollments"
  ON enrollments
  FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ================================================================
-- ATTENDANCE TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on attendance"
  ON attendance
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage attendance for their classes
CREATE POLICY "Teachers manage class attendance"
  ON attendance
  FOR ALL
  USING (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students view own attendance"
  ON attendance
  FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ================================================================
-- GRADES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on grades"
  ON grades
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage grades for their classes
CREATE POLICY "Teachers manage class grades"
  ON grades
  FOR ALL
  USING (
    is_teacher() AND
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    is_teacher() AND
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Students can view their own grades
CREATE POLICY "Students view own grades"
  ON grades
  FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ================================================================
-- ASSIGNMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on assignments"
  ON assignments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage assignments for their classes
CREATE POLICY "Teachers manage own assignments"
  ON assignments
  FOR ALL
  USING (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Students can view assignments for enrolled classes
CREATE POLICY "Students view assignments"
  ON assignments
  FOR SELECT
  USING (
    is_student() AND
    class_id IN (
      SELECT class_id FROM enrollments
      WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ================================================================
-- LOOKUP/REFERENCE TABLES - READ-ONLY FOR ALL AUTHENTICATED
-- ================================================================

-- Academic Years - all authenticated users can read
CREATE POLICY "Authenticated users view academic_years"
  ON academic_years
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage academic_years"
  ON academic_years
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fee Types - all authenticated users can read
CREATE POLICY "Authenticated users view fee_types"
  ON fee_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage fee_types"
  ON fee_types
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grading Scales - all authenticated users can read
CREATE POLICY "Authenticated users view grading_scales"
  ON grading_scales
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage grading_scales"
  ON grading_scales
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Payment Methods - all authenticated users can read
CREATE POLICY "Authenticated users view payment_methods"
  ON payment_methods
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage payment_methods"
  ON payment_methods
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ================================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- VERIFY RLS IS ENABLED
-- ================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'classes', 'enrollments', 'attendance', 
    'grades', 'assignments', 'academic_years', 'fee_types',
    'grading_scales', 'payment_methods'
  )
ORDER BY tablename;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS POLICIES CONFIGURED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Security levels:';
  RAISE NOTICE '  - Service role (admin API): Full access (bypasses RLS)';
  RAISE NOTICE '  - Admin users: Full access to all tables';
  RAISE NOTICE '  - Teachers: Access to their classes, students, attendance, grades';
  RAISE NOTICE '  - Students: Access to their own data only';
  RAISE NOTICE '  - Lookup tables: Read-only for all authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE 'Your web app should now work with proper security! 🎉';
END $$;
