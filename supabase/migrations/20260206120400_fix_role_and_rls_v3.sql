-- Migration: Fix Role Identification and Strengthen Profile RLS
-- Created: 2026-02-06
-- Purpose: Ensure get_current_user_role works for legacy users and fix RLS policies

-- 1. Fix the role identification function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE user_id = auth.uid() OR id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure we have the most robust UPDATE policies possible
-- Drop all variants we might have created
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile v2" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile v2Plus" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile v3" ON public.profiles;

-- Create the "v3" definitive policy
CREATE POLICY "Users can update their own profile v3"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR id = auth.uid());

-- 3. Fix the "Staff can update non-admin profiles" policy which might be failing due to the old function
DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON public.profiles;
CREATE POLICY "Staff can update non-admin profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    AND role NOT IN ('admin', 'staff')
  )
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff')
    AND role NOT IN ('admin', 'staff')
  );

-- 4. Do a one-time "Repair" of the profiles table
-- This links auth.users to profiles by matching their IDs if user_id is null
UPDATE public.profiles p
SET user_id = p.id
FROM auth.users au
WHERE p.user_id IS NULL AND p.id = au.id;

-- 5. Add a policy for SELECT if it's missing or weak
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Own profile access" ON public.profiles;
CREATE POLICY "Users can view their own profile v3"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid());

SELECT 'Role identification and RLS v3 enabled successfully' as status;
