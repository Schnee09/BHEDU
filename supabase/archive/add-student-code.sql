-- ================================================================
-- Add missing student_code column to profiles table
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add student_code column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code VARCHAR(50) UNIQUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
