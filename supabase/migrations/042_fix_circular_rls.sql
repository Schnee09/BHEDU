-- Migration 042: Fix circular RLS dependency between classes and enrollments
-- Date: 2025-01-20
-- Purpose: Break the circular dependency: students check enrollments -> enrollments check classes -> classes check enrollments
-- Solution: Use security definer functions to bypass RLS in specific checks

-- Create helper function to check if user is enrolled in a class (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(class_id_param uuid, student_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = class_id_param
    AND e.student_id = student_id_param
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_enrolled_in_class TO authenticated;

-- Create helper function to check if class belongs to teacher (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_class_teacher(class_id_param uuid, teacher_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_id_param
    AND c.teacher_id = teacher_id_param
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_class_teacher TO authenticated;

-- ============================================================================
-- Recreate classes policies without circular dependencies
-- ============================================================================

-- Drop all existing classes policies
DROP POLICY IF EXISTS "Admins read classes" ON public.classes;
DROP POLICY IF EXISTS "Admins insert classes" ON public.classes;
DROP POLICY IF EXISTS "Admins update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins delete classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
DROP POLICY IF EXISTS "Students read enrolled classes" ON public.classes;

-- Admins can do everything
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

-- Teachers can read their own classes (direct check, no enrollments lookup)
CREATE POLICY "Teachers read own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students can read classes they're enrolled in (using security definer function)
CREATE POLICY "Students read enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.is_enrolled_in_class(id, auth.uid()));

-- ============================================================================
-- Recreate enrollments policies without circular dependencies
-- ============================================================================

-- Drop all existing enrollments policies
DROP POLICY IF EXISTS "Admins read enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins delete enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;

-- Admins can do everything
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

-- Teachers can read enrollments for their classes (using security definer function)
CREATE POLICY "Teachers read class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()));

-- Students can read their own enrollments (direct check, no classes lookup)
CREATE POLICY "Students read own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Add comments for documentation
COMMENT ON FUNCTION public.is_enrolled_in_class IS 
  'Security definer function to check if student is enrolled in a class without triggering RLS recursion';

COMMENT ON FUNCTION public.is_class_teacher IS 
  'Security definer function to check if class belongs to teacher without triggering RLS recursion';

COMMENT ON POLICY "Admins read classes" ON public.classes IS 
  'Admins can read all classes using security definer function';

COMMENT ON POLICY "Teachers read own classes" ON public.classes IS 
  'Teachers can read their own classes using direct teacher_id check';

COMMENT ON POLICY "Students read enrolled classes" ON public.classes IS 
  'Students can read classes they are enrolled in using security definer function to prevent recursion';

COMMENT ON POLICY "Teachers read class enrollments" ON public.enrollments IS 
  'Teachers can read enrollments for their classes using security definer function to prevent recursion';

COMMENT ON POLICY "Students read own enrollments" ON public.enrollments IS 
  'Students can read their own enrollments using direct student_id check';
