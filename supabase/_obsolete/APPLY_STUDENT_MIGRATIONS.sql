------------------------------------------------------------
-- 🚀 Student CRUD Migrations - Combined File
-- Apply this directly in Supabase Dashboard → SQL Editor
-- Date: 2025-11-21
------------------------------------------------------------

-- This combines migrations 044, 045, and 046 into a single file
-- for easy application via Supabase Dashboard

------------------------------------------------------------
-- PART 1: Schema Enhancements (from 044)
------------------------------------------------------------

-- Ensure profiles table has all required fields for students
DO $$ 
BEGIN
  -- Add first_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  -- Add email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  -- Add date_of_birth if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  -- Add phone if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add address if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  -- Add emergency_contact if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact text;
  END IF;

  -- Add user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_first_last_name ON profiles(first_name, last_name);

-- Ensure enrollments table has required fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'enrollment_date'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN enrollment_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'status'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'withdrawn'));
  END IF;
END $$;

-- Create indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Create trigger to update updated_at
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

-- Sync full_name from first_name and last_name
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_full_name_trigger ON profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

------------------------------------------------------------
-- PART 2: RLS Policies (from 045)
------------------------------------------------------------

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing student-related policies
DROP POLICY IF EXISTS "Students can read own profile" ON profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Profile policies
CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enrollment policies
DROP POLICY IF EXISTS "Students view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers view enrollments for own classes" ON enrollments;
DROP POLICY IF EXISTS "Teachers manage enrollments for own classes" ON enrollments;
DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role full access enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can update class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can delete class enrollments" ON enrollments;

CREATE POLICY "Service role full access to enrollments"
  ON enrollments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins can manage all enrollments"
  ON enrollments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view class enrollments"
  ON enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can manage class enrollments"
  ON enrollments FOR INSERT TO authenticated
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
  ON enrollments FOR UPDATE TO authenticated
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
  ON enrollments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Grant permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON enrollments TO authenticated;
GRANT ALL ON enrollments TO service_role;

------------------------------------------------------------
-- PART 3: Helper Functions (from 046)
------------------------------------------------------------

-- Drop existing functions first to avoid parameter name conflicts
-- Using CASCADE to drop dependent policies that will be recreated
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_teacher(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_student(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_enrolled_in_class(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS has_active_enrollments(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_student_enrollment_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_class_enrollment_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_email_unique(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS batch_insert_enrollments(uuid[], uuid, date, text) CASCADE;
DROP FUNCTION IF EXISTS get_student_with_enrollments(uuid) CASCADE;

-- Check if user is admin
CREATE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Check if user is teacher
CREATE FUNCTION is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'teacher'
  );
END;
$$;

-- Check if user is student
CREATE FUNCTION is_student(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'student'
  );
END;
$$;

-- Check if student is enrolled in class
CREATE FUNCTION is_enrolled_in_class(
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
    SELECT 1 FROM enrollments
    WHERE class_id = p_class_id
    AND student_id = p_student_id
    AND status = 'active'
  );
END;
$$;

-- Check if student has active enrollments
CREATE FUNCTION has_active_enrollments(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments
    WHERE student_id = p_student_id AND status = 'active'
  );
END;
$$;

-- Get student enrollment count
CREATE FUNCTION get_student_enrollment_count(p_student_id uuid)
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
  WHERE student_id = p_student_id AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

-- Get class enrollment count
CREATE FUNCTION get_class_enrollment_count(p_class_id uuid)
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
  WHERE class_id = p_class_id AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

-- Check if email is unique
CREATE FUNCTION is_email_unique(
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
      SELECT 1 FROM profiles WHERE LOWER(email) = LOWER(p_email)
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE LOWER(email) = LOWER(p_email) AND id != p_exclude_id
    );
  END IF;
END;
$$;

-- Batch insert enrollments
CREATE FUNCTION batch_insert_enrollments(
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
    IF NOT is_enrolled_in_class(p_class_id, student_id) THEN
      INSERT INTO enrollments (student_id, class_id, enrollment_date, status)
      VALUES (student_id, p_class_id, p_enrollment_date, p_status);
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Get student with enrollments
CREATE FUNCTION get_student_with_enrollments(p_student_id uuid)
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

-- Grant execute permissions
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

-- Moved to archive for cleanup

-- Verify by running these queries:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
-- SELECT policyname FROM pg_policies WHERE tablename IN ('profiles', 'enrollments');
