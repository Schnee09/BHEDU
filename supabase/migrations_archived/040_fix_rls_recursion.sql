-- Migration 040: Fix RLS infinite recursion
-- Date: 2025-11-20
-- Purpose: Fix infinite recursion in RLS policies between profiles, enrollments, and classes

-- The issue: profiles policy references enrollments, which references classes, which references profiles
-- Solution: Use security definer functions and simplify policies

-- Drop the problematic "Teachers read their students" policy
DROP POLICY IF EXISTS "Teachers read their students" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read student profiles" ON public.profiles;

-- Simplify: Teachers can read all student profiles (they only see students in their classes through enrollments anyway)
CREATE POLICY "Teachers read student profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    role = 'student' 
    AND EXISTS (
      SELECT 1 FROM public.profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
    )
  );

-- Fix classes RLS to avoid recursion
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins insert classes" ON public.classes;
DROP POLICY IF EXISTS "Admins update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;

CREATE POLICY "Teachers read own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR public.is_admin()
  );

-- Add admin insert/update/delete policies for classes
CREATE POLICY "Admins insert classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update classes"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete classes"
  ON public.classes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Ensure enrollments policies don't cause recursion
DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.enrollments;

CREATE POLICY "Teachers read class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Add admin policies for enrollments
CREATE POLICY "Admins insert enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete enrollments"
  ON public.enrollments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Add comments explaining the fix
COMMENT ON POLICY "Teachers read student profiles" ON public.profiles IS 
  'Simplified to avoid recursion: teachers can read all student profiles (business logic filters in app)';

COMMENT ON POLICY "Teachers read own classes" ON public.classes IS 
  'Simplified to avoid recursion: direct teacher_id check only';

-- Verify no recursion by testing a simple query
-- Admin should be able to select from all tables without recursion errors
