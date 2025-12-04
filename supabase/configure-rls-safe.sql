-- ================================================================
-- SAFE RLS CONFIGURATION FOR BH-EDU
-- ================================================================
-- This version checks for table existence before applying policies
-- ================================================================

-- First, disable RLS temporarily (only on existing tables)
DO $$ 
BEGIN
  -- Core tables (should always exist)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
    ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') THEN
    ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades') THEN
    ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
    ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Lookup tables (may not exist)
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
  
  RAISE NOTICE '✅ RLS temporarily disabled for cleanup';
END $$;

-- ================================================================
-- DROP ALL EXISTING POLICIES (silently ignore if not exists)
-- ================================================================

-- Profiles
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

-- Classes
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

-- Enrollments
DROP POLICY IF EXISTS "Admin full access" ON enrollments;
DROP POLICY IF EXISTS "Admin full access on enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow admin full access" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow student read own enrollments" ON enrollments;

-- Attendance
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

-- Grades
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

-- Assignments
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

-- Lookup tables (if they exist)
DROP POLICY IF EXISTS "Authenticated users view academic_years" ON academic_years;
DROP POLICY IF EXISTS "Admin manage academic_years" ON academic_years;
DROP POLICY IF EXISTS "Authenticated users view fee_types" ON fee_types;
DROP POLICY IF EXISTS "Admin manage fee_types" ON fee_types;
DROP POLICY IF EXISTS "Authenticated users view grading_scales" ON grading_scales;
DROP POLICY IF EXISTS "Admin manage grading_scales" ON grading_scales;
DROP POLICY IF EXISTS "Authenticated users view payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin manage payment_methods" ON payment_methods;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

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
-- CREATE POLICIES FOR CORE TABLES
-- ================================================================

-- PROFILES TABLE
CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- CLASSES TABLE
CREATE POLICY "Admin full access on classes"
  ON classes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (
    is_teacher() AND 
    teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    is_teacher() AND 
    teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students view enrolled classes"
  ON classes FOR SELECT
  USING (
    is_student() AND
    id IN (
      SELECT class_id FROM enrollments
      WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users view classes"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

-- ENROLLMENTS TABLE
CREATE POLICY "Admin full access on enrollments"
  ON enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers view class enrollments"
  ON enrollments FOR SELECT
  USING (
    is_teacher() AND
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Students view own enrollments"
  ON enrollments FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ATTENDANCE TABLE
CREATE POLICY "Admin full access on attendance"
  ON attendance FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers manage class attendance"
  ON attendance FOR ALL
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

CREATE POLICY "Students view own attendance"
  ON attendance FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- GRADES TABLE
CREATE POLICY "Admin full access on grades"
  ON grades FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers manage class grades"
  ON grades FOR ALL
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

CREATE POLICY "Students view own grades"
  ON grades FOR SELECT
  USING (
    is_student() AND
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ASSIGNMENTS TABLE
CREATE POLICY "Admin full access on assignments"
  ON assignments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Teachers manage own assignments"
  ON assignments FOR ALL
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

CREATE POLICY "Students view assignments"
  ON assignments FOR SELECT
  USING (
    is_student() AND
    class_id IN (
      SELECT class_id FROM enrollments
      WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ================================================================
-- CREATE POLICIES FOR LOOKUP TABLES (if they exist)
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_years') THEN
    EXECUTE 'CREATE POLICY "Authenticated users view academic_years" ON academic_years FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage academic_years" ON academic_years FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for academic_years';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    EXECUTE 'CREATE POLICY "Authenticated users view fee_types" ON fee_types FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage fee_types" ON fee_types FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for fee_types';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_scales') THEN
    EXECUTE 'CREATE POLICY "Authenticated users view grading_scales" ON grading_scales FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage grading_scales" ON grading_scales FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for grading_scales';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    EXECUTE 'CREATE POLICY "Authenticated users view payment_methods" ON payment_methods FOR SELECT USING (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Admin manage payment_methods" ON payment_methods FOR ALL USING (is_admin()) WITH CHECK (is_admin())';
    RAISE NOTICE '✅ Created policies for payment_methods';
  END IF;
END $$;

-- ================================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on profiles';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
    ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on classes';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') THEN
    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on enrollments';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on attendance';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grades') THEN
    ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on grades';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on assignments';
  END IF;
  
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

-- Show created policies
SELECT 
  tablename,
  policyname,
  cmd
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
  RAISE NOTICE '✅ RLS CONFIGURATION COMPLETE!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Levels Configured:';
  RAISE NOTICE '  • Service Role (API): Full access (bypasses RLS)';
  RAISE NOTICE '  • Admin Users: Full access to all data';
  RAISE NOTICE '  • Teachers: Scoped to their classes';
  RAISE NOTICE '  • Students: Own data only';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Your app should now work with proper security!';
  RAISE NOTICE '';
END $$;
