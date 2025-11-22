-- Migration 041: Fix is_admin() function to prevent RLS recursion
-- Date: 2025-01-20
-- Purpose: The is_admin() function itself triggers RLS on profiles table, causing infinite recursion
-- Solution: Make is_admin() bypass RLS entirely by granting it proper permissions

-- First, ensure the function exists and is properly configured
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- This query will bypass RLS because of SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Ensure the function owner has proper permissions
-- The security definer function runs with the privileges of the owner (postgres)
-- which has full access without RLS restrictions

-- Now fix the profiles policies to break the recursion cycle
-- The key insight: Admin reads should ONLY use is_admin(), not any other profile checks

DROP POLICY IF EXISTS "Admins read all profiles (fn)" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Read teacher profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read their students" ON public.profiles;
DROP POLICY IF EXISTS "Students read own profile" ON public.profiles;

-- Policy 1: Admins can read all profiles (using the security definer function)
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 2: Users can read their own profile (no profile lookup needed)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Actually, let's fix this properly using a security definer function for teacher check too
CREATE OR REPLACE FUNCTION public.is_teacher(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'teacher'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_teacher TO authenticated;

-- Now recreate the teacher policy using the security definer function
DROP POLICY IF EXISTS "Teachers read students" ON public.profiles;
CREATE POLICY "Teachers read students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    role = 'student' AND (public.is_admin() OR public.is_teacher())
  );

-- Add insert/update/delete policies for admins on profiles
DROP POLICY IF EXISTS "Admins insert profiles" ON public.profiles;
CREATE POLICY "Admins insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Add self-update policy for users to update their own profile
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add comments
COMMENT ON FUNCTION public.is_admin IS 
  'Security definer function to check if user is admin without triggering RLS recursion';

COMMENT ON FUNCTION public.is_teacher IS 
  'Security definer function to check if user is teacher without triggering RLS recursion';

COMMENT ON POLICY "Admins read all profiles" ON public.profiles IS 
  'Admins can read all profiles using security definer function to prevent recursion';

COMMENT ON POLICY "Teachers read students" ON public.profiles IS 
  'Teachers and admins can read student profiles using security definer functions to prevent recursion';

-- ============================================================================
-- Fix classes table RLS to avoid recursion
-- ============================================================================

-- Drop all existing classes policies
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins read all classes" ON public.classes;
DROP POLICY IF EXISTS "Admins insert classes" ON public.classes;
DROP POLICY IF EXISTS "Admins update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;
DROP POLICY IF EXISTS "Students read enrolled classes" ON public.classes;

-- Policy 1: Admins can do everything with classes
DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
CREATE POLICY "Admins read classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.is_admin());

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

-- Policy 2: Teachers can read their own classes (direct check, no profile lookup)
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
CREATE POLICY "Teachers read own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Policy 3: Students can read classes they're enrolled in
DROP POLICY IF EXISTS "Students read enrolled classes" ON public.classes;
CREATE POLICY "Students read enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = auth.uid()
    )
  );

-- ============================================================================
-- Fix enrollments table RLS to avoid recursion
-- ============================================================================

-- Drop all existing enrollments policies
DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;

-- Policy 1: Admins can do everything with enrollments
CREATE POLICY "Admins read enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (public.is_admin());

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

-- Policy 2: Teachers can read enrollments for their classes (direct check)
DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
CREATE POLICY "Teachers read class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = enrollments.class_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Policy 3: Students can read their own enrollments
DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;
CREATE POLICY "Students read own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Add comments for documentation
COMMENT ON POLICY "Admins read classes" ON public.classes IS 
  'Admins can read all classes using security definer function to prevent recursion';

COMMENT ON POLICY "Teachers read own classes" ON public.classes IS 
  'Teachers can read their own classes using direct teacher_id check';

COMMENT ON POLICY "Students read enrolled classes" ON public.classes IS 
  'Students can read classes they are enrolled in';

COMMENT ON POLICY "Teachers read class enrollments" ON public.enrollments IS 
  'Teachers can read enrollments for their classes';

COMMENT ON POLICY "Students read own enrollments" ON public.enrollments IS 
  'Students can read their own enrollments';
