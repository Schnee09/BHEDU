-- ================================================================
-- FIX ADMIN ACCESS - Add Admin Policies for Attendance & Assignments
-- ================================================================
-- This script ensures admins can read all attendance and assignment records
-- ================================================================

-- Check if policies exist for admins
DO $$
BEGIN
  RAISE NOTICE 'Checking and creating admin policies...';
END $$;

-- ================================================================
-- ATTENDANCE TABLE - Admin Policies
-- ================================================================

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admin full access attendance" ON attendance;
DROP POLICY IF EXISTS "Admins manage all attendance" ON attendance;

-- Create comprehensive admin policy for attendance
CREATE POLICY "Admins have full access to attendance"
  ON attendance
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

COMMENT ON POLICY "Admins have full access to attendance" ON attendance IS
  'Allows admin users to SELECT, INSERT, UPDATE, DELETE all attendance records';

-- ================================================================
-- ASSIGNMENTS TABLE - Admin Policies  
-- ================================================================

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all assignments" ON assignments;
DROP POLICY IF EXISTS "Admin full access assignments" ON assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON assignments;

-- Create comprehensive admin policy for assignments
CREATE POLICY "Admins have full access to assignments"
  ON assignments
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

COMMENT ON POLICY "Admins have full access to assignments" ON assignments IS
  'Allows admin users to SELECT, INSERT, UPDATE, DELETE all assignment records';

-- ================================================================
-- CLASSES TABLE - Admin Policies (needed for JOIN queries)
-- ================================================================

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can view all classes" ON classes;
DROP POLICY IF EXISTS "Admin full access classes" ON classes;
DROP POLICY IF EXISTS "Admins manage all classes" ON classes;

-- Create comprehensive admin policy for classes
CREATE POLICY "Admins have full access to classes"
  ON classes
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

COMMENT ON POLICY "Admins have full access to classes" ON classes IS
  'Allows admin users to SELECT, INSERT, UPDATE, DELETE all class records';

-- ================================================================
-- PROFILES TABLE - Admin Read Access (for attendance JOIN)
-- ================================================================

-- Ensure admins can read all profiles (needed for student names in attendance)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;

CREATE POLICY "Admins have full access to profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins have full access to profiles" ON profiles IS
  'Allows admin users to SELECT, INSERT, UPDATE, DELETE all profile records';

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT 
  '=== ADMIN RLS POLICIES VERIFICATION ===' as info,
  '' as details
UNION ALL
SELECT 
  'Attendance policies:' as info,
  string_agg(policyname, ', ') as details
FROM pg_policies
WHERE tablename = 'attendance'
  AND policyname LIKE '%admin%'
UNION ALL
SELECT 
  'Assignment policies:' as info,
  string_agg(policyname, ', ') as details
FROM pg_policies
WHERE tablename = 'assignments'
  AND policyname LIKE '%admin%'
UNION ALL
SELECT 
  'Class policies:' as info,
  string_agg(policyname, ', ') as details
FROM pg_policies
WHERE tablename = 'classes'
  AND policyname LIKE '%admin%'
UNION ALL
SELECT 
  'Profile policies:' as info,
  string_agg(policyname, ', ') as details
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname LIKE '%admin%';

-- ================================================================
-- DONE! Admin users should now have full access to attendance and assignments
-- ================================================================
