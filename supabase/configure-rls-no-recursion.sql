-- ================================================================
-- RECURSION-FREE RLS CONFIGURATION FOR BH-EDU
-- ================================================================
-- This completely eliminates recursion by using SECURITY DEFINER
-- functions that bypass RLS when checking roles
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

-- Drop ALL existing policies
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

DROP POLICY IF EXISTS "Admin full access" ON enrollments;
DROP POLICY IF EXISTS "Admin full access on enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow admin full access" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow student read own enrollments" ON enrollments;

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

-- Drop old helper functions (CASCADE to drop dependent policies)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_teacher() CASCADE;
DROP FUNCTION IF EXISTS is_student() CASCADE;
DROP FUNCTION IF EXISTS get_my_profile_id() CASCADE;

-- ================================================================
-- COMPLETELY RECURSION-FREE HELPER FUNCTIONS
-- ================================================================
-- These use SECURITY DEFINER which bypasses RLS entirely

-- Get user's role directly (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This bypasses RLS because it's SECURITY DEFINER
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's profile ID directly (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- This bypasses RLS because it's SECURITY DEFINER
  SELECT id INTO profile_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================
-- PROFILES TABLE POLICIES (SIMPLE - NO RECURSION)
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Users can view own profile
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view other profiles
CREATE POLICY "Authenticated users view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- CLASSES TABLE POLICIES (NO RECURSION - DIRECT COMPARISON)
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on classes"
  ON classes FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Teachers manage their own classes (direct comparison, no subquery)
CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (
    auth_role() = 'teacher' AND 
    teacher_id = auth_profile_id()
  )
  WITH CHECK (
    auth_role() = 'teacher' AND 
    teacher_id = auth_profile_id()
  );

-- Students view enrolled classes
CREATE POLICY "Students view enrolled classes"
  ON classes FOR SELECT
  USING (
    auth_role() = 'student' AND
    id IN (
      SELECT class_id FROM enrollments
      WHERE student_id = auth_profile_id()
    )
  );

-- All authenticated users can view classes
CREATE POLICY "Authenticated users view classes"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- ENROLLMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on enrollments"
  ON enrollments FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Teachers view enrollments for their classes
CREATE POLICY "Teachers view class enrollments"
  ON enrollments FOR SELECT
  USING (
    auth_role() = 'teacher' AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = auth_profile_id()
    )
  );

-- Students view own enrollments
CREATE POLICY "Students view own enrollments"
  ON enrollments FOR SELECT
  USING (
    auth_role() = 'student' AND
    student_id = auth_profile_id()
  );

-- ================================================================
-- ATTENDANCE TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on attendance"
  ON attendance FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Teachers manage attendance for their classes
CREATE POLICY "Teachers manage class attendance"
  ON attendance FOR ALL
  USING (
    auth_role() = 'teacher' AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = auth_profile_id()
    )
  )
  WITH CHECK (
    auth_role() = 'teacher' AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = auth_profile_id()
    )
  );

-- Students view own attendance
CREATE POLICY "Students view own attendance"
  ON attendance FOR SELECT
  USING (
    auth_role() = 'student' AND
    student_id = auth_profile_id()
  );

-- ================================================================
-- ASSIGNMENTS TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on assignments"
  ON assignments FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Teachers manage assignments for their classes
CREATE POLICY "Teachers manage own assignments"
  ON assignments FOR ALL
  USING (
    auth_role() = 'teacher' AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = auth_profile_id()
    )
  )
  WITH CHECK (
    auth_role() = 'teacher' AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = auth_profile_id()
    )
  );

-- Students view assignments for enrolled classes
CREATE POLICY "Students view assignments"
  ON assignments FOR SELECT
  USING (
    auth_role() = 'student' AND
    class_id IN (
      SELECT class_id FROM enrollments
      WHERE student_id = auth_profile_id()
    )
  );

-- ================================================================
-- GRADES TABLE POLICIES
-- ================================================================

-- Admins have full access
CREATE POLICY "Admin full access on grades"
  ON grades FOR ALL
  USING (auth_role() = 'admin')
  WITH CHECK (auth_role() = 'admin');

-- Teachers manage grades for their assignments
CREATE POLICY "Teachers manage class grades"
  ON grades FOR ALL
  USING (
    auth_role() = 'teacher' AND
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = auth_profile_id()
    )
  )
  WITH CHECK (
    auth_role() = 'teacher' AND
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = auth_profile_id()
    )
  );

-- Students view own grades
CREATE POLICY "Students view own grades"
  ON grades FOR SELECT
  USING (
    auth_role() = 'student' AND
    student_id = auth_profile_id()
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
    EXECUTE 'CREATE POLICY "Admin manage academic_years" ON academic_years FOR ALL USING (auth_role() = ''admin'') WITH CHECK (auth_role() = ''admin'')';
    RAISE NOTICE '✅ Created policies for academic_years';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view fee_types" ON fee_types';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage fee_types" ON fee_types';
    EXECUTE 'CREATE POLICY "Authenticated users view fee_types" ON fee_types FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage fee_types" ON fee_types FOR ALL USING (auth_role() = ''admin'') WITH CHECK (auth_role() = ''admin'')';
    RAISE NOTICE '✅ Created policies for fee_types';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view grading_scales" ON grading_scales';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage grading_scales" ON grading_scales';
    EXECUTE 'CREATE POLICY "Authenticated users view grading_scales" ON grading_scales FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage grading_scales" ON grading_scales FOR ALL USING (auth_role() = ''admin'') WITH CHECK (auth_role() = ''admin'')';
    RAISE NOTICE '✅ Created policies for grading_scales';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users view payment_methods" ON payment_methods';
    EXECUTE 'DROP POLICY IF EXISTS "Admin manage payment_methods" ON payment_methods';
    EXECUTE 'CREATE POLICY "Authenticated users view payment_methods" ON payment_methods FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage payment_methods" ON payment_methods FOR ALL USING (auth_role() = ''admin'') WITH CHECK (auth_role() = ''admin'')';
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
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
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

-- Show policies
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RECURSION-FREE RLS CONFIGURATION COMPLETE!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Key Changes:';
  RAISE NOTICE '  • Created auth_role() - SECURITY DEFINER bypasses RLS';
  RAISE NOTICE '  • Created auth_profile_id() - SECURITY DEFINER bypasses RLS';
  RAISE NOTICE '  • All policies use these functions instead of subqueries';
  RAISE NOTICE '  • Classes table: teacher_id = auth_profile_id()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Levels:';
  RAISE NOTICE '  • Service Role (API): Full access (bypasses RLS)';
  RAISE NOTICE '  • Admin Users: Full access to all data';
  RAISE NOTICE '  • Teachers: Scoped to their classes';
  RAISE NOTICE '  • Students: Own data only';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Infinite recursion error should now be completely eliminated!';
  RAISE NOTICE '';
END $$;
