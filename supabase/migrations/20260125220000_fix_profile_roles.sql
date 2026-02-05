-- Migration: Fix Profile Roles Constraint
-- Created: 2026-01-25
-- Purpose: Expand the allowable roles in the profiles table to match seed data and system requirements

-- Step 1: Drop the existing constraint
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add the expanded constraint
-- Includes all roles used in seed.ts and established in permissions.config.ts
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN (
    'super_admin', 
    'owner', 
    'admin', 
    'staff', 
    'teacher', 
    'tutor', 
    'parent', 
    'student'
  ) OR role IS NULL);

-- Step 3: Add comment for clarity
COMMENT ON COLUMN public.profiles.role IS 'User roles: super_admin, owner, admin, staff, teacher, tutor, parent, student';

-- Verification
SELECT 'Profile roles constraint updated successfully' as status;
