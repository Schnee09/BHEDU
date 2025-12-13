-- SIMPLIFIED Migration: Add 'staff' role
-- Run this in Supabase SQL Editor
-- Date: 2025-12-09

-- Step 1: Update role constraint to include 'staff'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);

-- Step 2: Add comment for documentation
COMMENT ON COLUMN profiles.role IS 'User role: admin (super admin), staff (sub-admin/office), teacher, student';

-- Verify the change
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND contype = 'c';
