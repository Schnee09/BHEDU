-- Migration: Enhanced Student Profiles
-- Description: Add comprehensive student information fields to profiles table
-- Date: 2025-11-14

-- Add new columns to profiles table for enhanced student information
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS student_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add unique constraint on student_id (only if not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_key 
  ON profiles(student_id) 
  WHERE student_id IS NOT NULL;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_date ON profiles(enrollment_date);

-- Add check constraint for status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT profiles_status_check 
      CHECK (status IN ('active', 'inactive', 'graduated', 'transferred', 'suspended'));
  END IF;
END $$;

-- Add check constraint for gender values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_gender_check'
  ) THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT profiles_gender_check 
      CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
  END IF;
END $$;

-- Update RLS policies to include new fields
-- (existing policies should automatically cover new columns)

COMMENT ON COLUMN profiles.phone IS 'Student or parent contact phone number';
COMMENT ON COLUMN profiles.address IS 'Student residential address';
COMMENT ON COLUMN profiles.date_of_birth IS 'Student date of birth';
COMMENT ON COLUMN profiles.gender IS 'Student gender';
COMMENT ON COLUMN profiles.student_id IS 'Unique student ID number (school-assigned)';
COMMENT ON COLUMN profiles.enrollment_date IS 'Date when student enrolled';
COMMENT ON COLUMN profiles.grade_level IS 'Current grade level (e.g., Grade 1, Grade 10, etc.)';
COMMENT ON COLUMN profiles.status IS 'Student enrollment status';
COMMENT ON COLUMN profiles.photo_url IS 'URL to student profile photo';
