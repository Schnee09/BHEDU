-- ============================================================================
-- 4-ROLE SYSTEM SETUP: Complete SQL Script
-- ============================================================================
-- 
-- This script can be pasted directly into Supabase SQL Editor
-- It will:
-- 1. Add 'staff' role to the system
-- 2. Create test accounts for all 4 roles
-- 
-- ============================================================================

-- PART 1: MIGRATION - Update role constraint
-- ============================================================================

-- Drop existing check constraint if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint that includes 'staff'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);

-- PART 2: Update RLS policies for staff role
-- ============================================================================

-- Profiles: Staff can view and update non-staff/admin users
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
CREATE POLICY "Staff can view all profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON profiles;
CREATE POLICY "Staff can update non-admin profiles" 
ON profiles FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
  AND role NOT IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
  AND role NOT IN ('admin', 'staff')
);

-- Students table
DROP POLICY IF EXISTS "Staff can view all students" ON students;
CREATE POLICY "Staff can view all students" 
ON students FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can manage students" ON students;
CREATE POLICY "Staff can manage students" 
ON students FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

-- Classes table
DROP POLICY IF EXISTS "Staff can view all classes" ON classes;
CREATE POLICY "Staff can view all classes" 
ON classes FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can manage classes" ON classes;
CREATE POLICY "Staff can manage classes" 
ON classes FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

-- Attendance table
DROP POLICY IF EXISTS "Staff can view all attendance" ON attendance;
CREATE POLICY "Staff can view all attendance" 
ON attendance FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can manage attendance" ON attendance;
CREATE POLICY "Staff can manage attendance" 
ON attendance FOR INSERT 
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
CREATE POLICY "Staff can update attendance" 
ON attendance FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

-- Finance tables
DROP POLICY IF EXISTS "Staff can manage student accounts" ON student_accounts;
CREATE POLICY "Staff can manage student accounts" 
ON student_accounts FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can manage invoices" ON invoices;
CREATE POLICY "Staff can manage invoices" 
ON invoices FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
CREATE POLICY "Staff can manage payments" 
ON payments FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

-- Grades table (read-only for staff)
DROP POLICY IF EXISTS "Staff can view all grades" ON grades;
CREATE POLICY "Staff can view all grades" 
ON grades FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
);

-- ============================================================================
-- PART 3: Update column comments
-- ============================================================================

COMMENT ON COLUMN profiles.role IS 'User role: admin (super admin), staff (sub-admin/office), teacher, student';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify:
-- 1. Check constraint updated: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='profiles';
-- 2. Test profiles should still exist (may need to create them separately via auth)

-- ============================================================================
-- NOTES FOR MANUAL SETUP
-- ============================================================================
-- To create test accounts manually:
--
-- 1. Via Supabase Dashboard:
--    - Auth > Users > Add user
--    - Email: admin@test.com
--    - Password: test123
--    - Auto confirm email: ON
--
-- 2. Then update profile:
--    UPDATE profiles 
--    SET role = 'admin', full_name = 'Admin User'
--    WHERE email = 'admin@test.com';
--
-- 3. Repeat for:
--    - staff@test.com → role = 'staff'
--    - teacher@test.com → role = 'teacher'
--    - student@test.com → role = 'student'

PRINT('✅ Migration complete! Test account setup instructions in notes above.');
