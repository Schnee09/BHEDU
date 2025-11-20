------------------------------------------------------------
-- 🔐 Student Management RLS Policies
-- Migration: 045_student_management_rls
-- Date: 2025-11-21
-- Description: Row-level security policies for student CRUD operations
------------------------------------------------------------

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing student-related policies to avoid conflicts
DROP POLICY IF EXISTS "Students can read own profile" ON profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

------------------------------------------------------------
-- Profile Policies
------------------------------------------------------------

-- Policy: Service role (backend) has full access
CREATE POLICY "Service role full access to profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read all profiles (for lookups)
CREATE POLICY "Authenticated users can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert new profiles (for user creation)
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

------------------------------------------------------------
-- Enrollment Policies
------------------------------------------------------------

-- Enable RLS on enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing enrollment policies to avoid conflicts
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view enrollments for own classes" ON enrollments;
DROP POLICY IF EXISTS "Teachers manage enrollments for own classes" ON enrollments;
DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role full access enrollments" ON enrollments;

-- Policy: Service role has full access
CREATE POLICY "Service role full access to enrollments"
  ON enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

-- Policy: Admins can manage all enrollments
CREATE POLICY "Admins can manage all enrollments"
  ON enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Teachers can view enrollments for their classes
CREATE POLICY "Teachers can view class enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Policy: Teachers can manage enrollments for their classes
CREATE POLICY "Teachers can manage class enrollments"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update class enrollments"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete class enrollments"
  ON enrollments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

------------------------------------------------------------
-- Grant necessary permissions
------------------------------------------------------------

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Grant permissions on enrollments table
GRANT SELECT, INSERT, UPDATE, DELETE ON enrollments TO authenticated;
GRANT ALL ON enrollments TO service_role;

-- Comments for documentation
COMMENT ON POLICY "Service role full access to profiles" ON profiles IS 
  'Backend service has unrestricted access for CRUD operations';

COMMENT ON POLICY "Authenticated users can read profiles" ON profiles IS 
  'All authenticated users can read profiles for lookups and display';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Users can update their own profile information';

COMMENT ON POLICY "Admins can insert profiles" ON profiles IS 
  'Admins can create new user profiles (students, teachers)';

COMMENT ON POLICY "Students can view own enrollments" ON enrollments IS 
  'Students can view their enrollment history';

COMMENT ON POLICY "Admins can manage all enrollments" ON enrollments IS 
  'Admins have full access to manage student enrollments';
