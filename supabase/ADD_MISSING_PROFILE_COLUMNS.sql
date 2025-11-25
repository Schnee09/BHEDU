-- Add missing columns to profiles table
-- These columns are referenced throughout the API code but don't exist in the schema

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);

COMMENT ON COLUMN profiles.student_id IS 'Student identification number';
COMMENT ON COLUMN profiles.grade_level IS 'Current grade level for students';
