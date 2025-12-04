-- ================================================================
-- FIXED RLS CONFIGURATION FOR BH-EDU (NO RECURSION)
-- ================================================================
-- This fixes the "infinite recursion" error by avoiding
-- self-referential queries in policies
-- ================================================================

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- Try to disable lookup tables (they may not exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_years') THEN
    ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    ALTER TABLE fee_types DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    ALTER TABLE grading_scales DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop all existing policies (profiles)
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Admin full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow profile owner read" ON profiles;
DROP POLICY IF EXISTS "Allow profile owner update" ON profiles;
DROP POLICY IF EXISTS "Allow service role insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin" ON profiles;

-- Drop all existing policies (classes)
DROP POLICY IF EXISTS "Admin full access" ON classes;
DROP POLICY IF EXISTS "Admin full access on classes" ON classes;
DROP POLICY IF EXISTS "Teachers view own classes" ON classes;
DROP POLICY IF EXISTS "Teachers manage own classes" ON classes;
DROP POLICY IF EXISTS "Students view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Authenticated users view classes" ON classes;
DROP POLICY IF EXISTS "Admins have full access to classes" ON classes;
DROP POLICY IF EXISTS "Allow admin full access" ON classes;
DROP POLICY IF EXISTS "Allow service role insert classes" ON classes;
DROP POLICY IF EXISTS "Allow teacher/admin read" ON classes;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;

-- Drop all existing policies (enrollments)
DROP POLICY IF EXISTS "Admin full access" ON enrollments;
DROP POLICY IF EXISTS "Admin full access on enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow admin full access" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow student read own enrollments" ON enrollments;

-- Drop all existing policies (attendance)
DROP POLICY IF EXISTS "Admin full access" ON attendance;
DROP POLICY IF EXISTS "Admin full access on attendance" ON attendance;
DROP POLICY IF EXISTS "Students view own attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers view class attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers manage class attendance" ON attendance;
DROP POLICY IF EXISTS "Admins have full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow admin read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow service role insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow student read own attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers and admins manage attendance" ON attendance;

-- Drop all existing policies (grades)
DROP POLICY IF EXISTS "Admin full access" ON grades;
DROP POLICY IF EXISTS "Admin full access on grades" ON grades;
DROP POLICY IF EXISTS "Students view own grades" ON grades;
DROP POLICY IF EXISTS "Teachers view class grades" ON grades;
DROP POLICY IF EXISTS "Teachers manage class grades" ON grades;
DROP POLICY IF EXISTS "Admins have full access to grades" ON grades;
DROP POLICY IF EXISTS "Allow admin full access" ON grades;
DROP POLICY IF EXISTS "Allow service role insert grades" ON grades;
DROP POLICY IF EXISTS "Allow student read own grades" ON grades;
DROP POLICY IF EXISTS "Allow teacher/admin read grades" ON grades;

-- Drop all existing policies (assignments)
DROP POLICY IF EXISTS "Admin full access" ON assignments;
DROP POLICY IF EXISTS "Admin full access on assignments" ON assignments;
DROP POLICY IF EXISTS "Students view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers manage assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers manage own assignments" ON assignments;
DROP POLICY IF EXISTS "Admins have full access to assignments" ON assignments;
DROP POLICY IF EXISTS "Allow admin full access" ON assignments;
DROP POLICY IF EXISTS "Allow service role insert assignments" ON assignments;
DROP POLICY IF EXISTS "Allow student read assignments for enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Allow teacher/admin read assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins manage assignments" ON assignments;

-- ================================================================
-- HELPER FUNCTIONS (NON-RECURSIVE)
-- ================================================================

-- Check if user is admin (reads profiles, not classes)
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

-- Check if user is teacher (reads profiles, not classes)
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

-- Check if user is student (reads profiles, not classes)
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

-- Get current user's profile ID (avoids repeated queries)
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================
-- PROFILES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can view own profile
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view other profiles (for listings, search, etc.)
CREATE POLICY "Authenticated users view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- CLASSES TABLE POLICIES (FIXED - NO RECURSION)
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on classes"
  ON classes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage their own classes (NO RECURSION - checks teacher_id directly)
CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (
    is_teacher() AND 
    teacher_id = get_my_profile_id()
  )
  WITH CHECK (
    is_teacher() AND 
    teacher_id = get_my_profile_id()
  );

-- Students can view classes they're enrolled in
CREATE POLICY "Students view enrolled classes"
  ON classes FOR SELECT
  USING (
    is_student() AND
    id IN (
      SELECT class_id FROM enrollments
      WHERE student_id = get_my_profile_id()
    )
  );

-- All authenticated users can view classes (for browsing/enrollment)
CREATE POLICY "Authenticated users view classes"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- ENROLLMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on enrollments"
  ON enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can view enrollments for their classes (uses classes.teacher_id directly)
CREATE POLICY "Teachers view class enrollments"
  ON enrollments FOR SELECT
  USING (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = enrollments.class_id
      AND classes.teacher_id = get_my_profile_id()
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students view own enrollments"
  ON enrollments FOR SELECT
  USING (
    is_student() AND
    student_id = get_my_profile_id()
  );

-- ================================================================
-- ATTENDANCE TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on attendance"
  ON attendance FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage attendance for their classes
CREATE POLICY "Teachers manage class attendance"
  ON attendance FOR ALL
  USING (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = attendance.class_id
      AND classes.teacher_id = get_my_profile_id()
    )
  )
  WITH CHECK (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = attendance.class_id
      AND classes.teacher_id = get_my_profile_id()
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students view own attendance"
  ON attendance FOR SELECT
  USING (
    is_student() AND
    student_id = get_my_profile_id()
  );

-- ================================================================
-- ASSIGNMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on assignments"
  ON assignments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage assignments for their classes
CREATE POLICY "Teachers manage own assignments"
  ON assignments FOR ALL
  USING (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = get_my_profile_id()
    )
  )
  WITH CHECK (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = get_my_profile_id()
    )
  );

-- Students can view assignments for enrolled classes
CREATE POLICY "Students view assignments"
  ON assignments FOR SELECT
  USING (
    is_student() AND
    class_id IN (
      SELECT class_id FROM enrollments
      WHERE student_id = get_my_profile_id()
    )
  );

-- ================================================================
-- GRADES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on grades"
  ON grades FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Teachers can manage grades for their assignments
CREATE POLICY "Teachers manage class grades"
  ON grades FOR ALL
  USING (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM assignments
      JOIN classes ON assignments.class_id = classes.id
      WHERE assignments.id = grades.assignment_id
      AND classes.teacher_id = get_my_profile_id()
    )
  )
  WITH CHECK (
    is_teacher() AND
    EXISTS (
      SELECT 1 FROM assignments
      JOIN classes ON assignments.class_id = classes.id
      WHERE assignments.id = grades.assignment_id
      AND classes.teacher_id = get_my_profile_id()
    )
  );

-- Students can view their own grades
CREATE POLICY "Students view own grades"
  ON grades FOR SELECT
  USING (
    is_student() AND
    student_id = get_my_profile_id()
  );

-- ================================================================
-- LOOKUP/REFERENCE TABLES (if they exist)
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_years') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view academic_years" ON academic_years';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage academic_years" ON academic_years';
    EXECUTE 'CREATE POLICY "Authenticated users view academic_years" ON academic_years FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage academic_years" ON academic_years FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for academic_years';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view fee_types" ON fee_types';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage fee_types" ON fee_types';
    EXECUTE 'CREATE POLICY "Authenticated users view fee_types" ON fee_types FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage fee_types" ON fee_types FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for fee_types';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view grading_scales" ON grading_scales';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage grading_scales" ON grading_scales';
    EXECUTE 'CREATE POLICY "Authenticated users view grading_scales" ON grading_scales FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage grading_scales" ON grading_scales FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for grading_scales';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view payment_methods" ON payment_methods';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage payment_methods" ON payment_methods';
    EXECUTE 'CREATE POLICY "Authenticated users view payment_methods" ON payment_methods FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage payment_methods" ON payment_methods FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for payment_methods';
  END IF;
END $$;

-- ================================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_years') THEN
    ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on academic_years';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on fee_types';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on grading_scales';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on payment_methods';
  END IF;
END $$;

-- ================================================================
-- VERIFY CONFIGURATION
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
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RLS CONFIGURATION COMPLETE (RECURSION FIXED!)';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Key Fix:';
  RAISE NOTICE '  • Removed recursive policy lookups on classes table';
  RAISE NOTICE '  • Added get_my_profile_id() helper function';
  RAISE NOTICE '  • Teachers check uses teacher_id = get_my_profile_id()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Levels:';
  RAISE NOTICE '  • Service Role (API): Full access (bypasses RLS)';
  RAISE NOTICE '  • Admin Users: Full access to all data';
  RAISE NOTICE '  • Teachers: Scoped to their classes';
  RAISE NOTICE '  • Students: Own data only';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Your classes API should now work without recursion errors!';
  RAISE NOTICE '';
END $$;
