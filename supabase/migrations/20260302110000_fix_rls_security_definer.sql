-- Migration: Fix RLS Recursion and Permissions
-- Created: 2026-03-02
-- Purpose: 
--   1. Resolve infinite recursion in profiles/subjects RLS
--   2. Fix broken profile ID check in subjects policy
--   3. Optimize performance of security functions

-- ============================================
-- PHASE 1: REFACTOR SECURITY FUNCTIONS
-- ============================================

-- Fix get_current_user_role: Use SECURITY DEFINER and SET search_path to bypass RLS safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  -- The SECURITY DEFINER attribute ensures this runs as the owner (postgres)
  -- which bypasses RLS on the profiles table. 
  -- SET search_path prevents search path injection attacks and ensures public schema is used.
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Also update is_admin and is_staff to be consistent
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- PHASE 2: REFRESH RLS POLICIES
-- ============================================

-- 1. Profiles: Ensure NO RECURSION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all potentially recursive policies
DROP POLICY IF EXISTS "Anyone can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin staff all profiles" ON public.profiles;

-- Base policy: Simple self-check (no function call)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

-- Admin/Staff policy: Uses non-recursive function (because function is SECURITY DEFINER)
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- 2. Subjects: Fix broken profile ID check
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;

CREATE POLICY "Admins manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. Courses: Ensure robust management
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- DONE
-- ============================================
SELECT 'RLS recursion fix applied successfully!' as status;
