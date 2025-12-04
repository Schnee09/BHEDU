-- ================================================================
-- COMPLETE RLS FIX - All Tables for Admin Access
-- ================================================================
-- This ensures admins have full access to ALL necessary tables
-- ================================================================

-- ================================================================
-- 1. ENROLLMENTS - Needed for student/class relationships
-- ================================================================
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;

CREATE POLICY "Admins have full access to enrollments"
  ON enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================================
-- 2. GRADES - Needed for grade display
-- ================================================================
DROP POLICY IF EXISTS "Admins have full access to grades" ON grades;

CREATE POLICY "Admins have full access to grades"
  ON grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================================
-- 3. Add SELECT policy for authenticated users to read necessary data
-- ================================================================

-- Everyone can read classes (but check with teacher_id for modifications)
DROP POLICY IF EXISTS "Authenticated users can view classes" ON classes;

CREATE POLICY "Authenticated users can view classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

-- Teachers can manage their own classes
DROP POLICY IF EXISTS "Teachers manage own classes" ON classes;

CREATE POLICY "Teachers manage own classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================================
-- 4. Ensure ALL authenticated users can read profiles (for names/emails)
-- ================================================================
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile OR admins can update any
DROP POLICY IF EXISTS "Users can update own profile or admin" ON profiles;

CREATE POLICY "Users can update own profile or admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ================================================================
-- 5. Attendance - Everyone can view, admins and teachers can modify
-- ================================================================
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON attendance;

CREATE POLICY "Authenticated users can view attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers and admins manage attendance" ON attendance;

CREATE POLICY "Teachers and admins manage attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- ================================================================
-- 6. Assignments - Everyone can view, admins and teachers can modify
-- ================================================================
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;

CREATE POLICY "Authenticated users can view assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers and admins manage assignments" ON assignments;

CREATE POLICY "Teachers and admins manage assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- ================================================================
-- VERIFICATION
-- ================================================================
SELECT 
  '=== RLS POLICIES SUMMARY ===' as info
UNION ALL
SELECT 
  CONCAT(schemaname, '.', tablename, ': ', COUNT(*)::TEXT, ' policies') as info
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'classes', 'attendance', 'assignments', 'enrollments', 'grades')
GROUP BY schemaname, tablename;

-- ================================================================
-- DONE! All tables should now have proper RLS policies
-- ================================================================
