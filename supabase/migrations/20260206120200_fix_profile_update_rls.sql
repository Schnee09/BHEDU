-- Migration: Fix Profile Update RLS
-- Created: 2026-02-06
-- Purpose: Allow users to update their own profile records

-- Drop existing update policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create UPDATE policy for users to manage their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also ensure INSERT policy exists in case it's needed (though usually handled by triggers)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Verify
SELECT 'Profile update policies created successfully' as status;
