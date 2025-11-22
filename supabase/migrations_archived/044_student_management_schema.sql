------------------------------------------------------------
-- 📚 Student Management Schema Enhancements
-- Migration: 044_student_management_schema
-- Date: 2025-11-21
-- Description: Enhances profiles table and adds helper functions for student CRUD
------------------------------------------------------------

-- Ensure profiles table has all required fields for students
-- (Many of these may already exist from earlier migrations)
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

  -- Add email if not exists (for convenience)
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

  -- Add user_id if not exists (link to auth.users)
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Create index on full_name for search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_first_last_name ON profiles(first_name, last_name);

-- Ensure enrollments table has required fields
DO $$ 
BEGIN
  -- Add enrollment_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'enrollment_date'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN enrollment_date date DEFAULT CURRENT_DATE;
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'status'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'withdrawn'));
  END IF;
END $$;

-- Create indexes for enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure full_name is computed from first_name and last_name
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_full_name_trigger ON profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

-- Comment the tables for documentation
COMMENT ON TABLE profiles IS 'User profiles including students, teachers, and admins';
COMMENT ON COLUMN profiles.first_name IS 'User first name';
COMMENT ON COLUMN profiles.last_name IS 'User last name';
COMMENT ON COLUMN profiles.full_name IS 'Auto-computed full name from first_name and last_name';
COMMENT ON COLUMN profiles.email IS 'User email address (synced from auth.users)';
COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth for students';
COMMENT ON COLUMN profiles.phone IS 'Phone number';
COMMENT ON COLUMN profiles.address IS 'Physical address';
COMMENT ON COLUMN profiles.emergency_contact IS 'Emergency contact information (phone or email)';

COMMENT ON TABLE enrollments IS 'Student enrollments in classes';
COMMENT ON COLUMN enrollments.enrollment_date IS 'Date when student enrolled';
COMMENT ON COLUMN enrollments.status IS 'Enrollment status: active, inactive, completed, or withdrawn';
