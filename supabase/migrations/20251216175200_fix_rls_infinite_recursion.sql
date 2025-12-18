-- Migration: Fix infinite recursion in RLS policies
-- Created: 2025-12-16
-- The profiles table RLS policies were causing infinite recursion by querying themselves

-- Create a security definer function to get current user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON public.profiles;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

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

-- Also fix other table policies that have the same issue
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
DROP POLICY IF EXISTS "Staff can manage students" ON public.students;

CREATE POLICY "Staff can view all students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Fix classes policies
DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can manage classes" ON public.classes;

CREATE POLICY "Staff can view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Fix enrollments policies
DROP POLICY IF EXISTS "Staff can manage enrollments" ON public.enrollments;

CREATE POLICY "Staff can manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Fix attendance policies
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance;

CREATE POLICY "Staff can view all attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Fix financial policies
DROP POLICY IF EXISTS "Staff can manage student accounts" ON public.student_accounts;
DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

CREATE POLICY "Staff can manage student accounts"
  ON public.student_accounts FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- Fix grades policy
DROP POLICY IF EXISTS "Staff can view all grades" ON public.grades;

CREATE POLICY "Staff can view all grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));