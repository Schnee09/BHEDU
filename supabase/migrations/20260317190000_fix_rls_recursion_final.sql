
-- Migration: Fix Infinite Recursion in Profiles RLS
-- Created: 2026-03-17
-- Target: Resolve 42P17 (infinite recursion) in profiles table

-- ============================================
-- 1. STRENGTHEN SECURITY FUNCTIONS (Non-Recursive)
-- ============================================

-- Robust user role check (Security Definer bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  -- Run as the function owner to bypass RLS on profiles
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Robust profile ID check (Security Definer bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper to check if a student is enrolled in a class (Security Definer)
CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_class(target_class_id uuid)
RETURNS boolean AS $$
DECLARE
  current_pid uuid;
BEGIN
  current_pid := public.get_current_profile_id();
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = current_pid AND class_id = target_class_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. REPAIR PROFILE RLS (Remove recursive subqueries)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all variants of the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile v3" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Students view their teachers" ON public.profiles;

-- Base policy: Simple check
CREATE POLICY "Profiles view self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin/Staff policy: Uses non-recursive function
CREATE POLICY "Profiles view staff"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

-- Student visibility of teachers (Uses Security Definer to avoid recursion)
-- A student can see a profile if that profile is a teacher of one of their classes
CREATE POLICY "Profiles student view teachers"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND role = 'teacher'
    AND id IN (
      SELECT teacher_id FROM public.classes
      WHERE id IN (
        SELECT class_id FROM public.enrollments 
        WHERE student_id = public.get_current_profile_id()
      )
    )
  );

-- ============================================
-- 3. REPAIR CLASSES RLS (Consistency)
-- ============================================

DROP POLICY IF EXISTS "Students view enrolled classes" ON public.classes;

CREATE POLICY "Classes view enrolled student"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND id IN (
      SELECT class_id FROM public.enrollments 
      WHERE student_id = public.get_current_profile_id()
    )
  );

-- ============================================
-- 4. REPAIR ENROLLMENTS RLS (Consistency)
-- ============================================

DROP POLICY IF EXISTS "Students view own enrollments" ON public.enrollments;

CREATE POLICY "Enrollments view self student"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND student_id = public.get_current_profile_id()
  );

-- ============================================
-- FINISH
-- ============================================
SELECT 'RLS recursion fix finalized' as result;
