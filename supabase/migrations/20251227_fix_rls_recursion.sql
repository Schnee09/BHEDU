-- ============================================
-- FIX PROFILES RLS - Avoid Infinite Recursion
-- Run this AFTER comprehensive_rls.sql
-- ============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Staff view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

-- Create a SECURITY DEFINER function to safely get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Recreate policies using the safe function
CREATE POLICY "Staff view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()  -- Can always view own
    OR public.get_my_role() IN ('admin', 'staff', 'teacher')  -- Staff can view all
  );

-- Admins can manage all
CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Also fix classes policy that has same issue
DROP POLICY IF EXISTS "Staff view all classes" ON public.classes;
DROP POLICY IF EXISTS "Staff manage classes" ON public.classes;

CREATE POLICY "Staff view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR public.get_my_role() IN ('admin', 'staff')
  );

CREATE POLICY "Staff manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'staff'));
