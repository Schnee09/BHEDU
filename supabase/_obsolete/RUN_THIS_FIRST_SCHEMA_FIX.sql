-- ========================================
-- CRITICAL: Run this SQL in Supabase SQL Editor FIRST
-- ========================================
-- This adds ONLY the missing columns that your code expects
-- Your schema already has: id, user_id, first_name, last_name, full_name, email, 
-- date_of_birth, phone, address, emergency_contact, role, student_id, grade_level

-- Add ONLY the missing columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add unique constraint on student_id (only if not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_key 
  ON profiles(student_id) 
  WHERE student_id IS NOT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_date ON profiles(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);

-- Add unique constraint to attendance table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_student_class_date_unique'
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE attendance ADD CONSTRAINT attendance_student_class_date_unique UNIQUE (student_id, class_id, date);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN profiles.address IS 'Residential address';
COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN profiles.gender IS 'Gender';
COMMENT ON COLUMN profiles.student_id IS 'Unique student ID number (school-assigned)';
COMMENT ON COLUMN profiles.enrollment_date IS 'Date when student enrolled';
COMMENT ON COLUMN profiles.grade_level IS 'Current grade level';
COMMENT ON COLUMN profiles.status IS 'User status (active/inactive/etc)';
COMMENT ON COLUMN profiles.photo_url IS 'URL to profile photo';
COMMENT ON COLUMN profiles.department IS 'Department (for teachers/staff)';
COMMENT ON COLUMN profiles.is_active IS 'Whether user account is active';
COMMENT ON COLUMN profiles.created_by IS 'User ID who created this profile';
COMMENT ON COLUMN profiles.notes IS 'Additional notes';

-- Verify the columns exist
SELECT 
  'Profiles table columns:' as message,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
