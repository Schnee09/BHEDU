-- SIMPLIFIED Migration: Add 'staff' role
-- Run this in Supabase SQL Editor
-- Date: 2025-12-09

-- Step 1: Update role constraint to include 'staff'
DO $$
BEGIN
  -- Only run these statements if the profiles table exists in the shadow DB.
  IF to_regclass('public.profiles') IS NOT NULL THEN

    -- Drop existing check constraint if it exists
    ALTER TABLE profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

    -- Add new check constraint that includes 'staff'
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);

    -- Step 2: Add comment for documentation
    COMMENT ON COLUMN profiles.role IS 'User role: admin (super admin), staff (sub-admin/office), teacher, student';

    -- Verify the change (only if profiles table exists)
    PERFORM 1 FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND contype = 'c';

  END IF;
END
$$;
