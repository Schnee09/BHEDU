-- Migration 043: Fix RLS circular dependencies in assignments and grades tables
-- Date: 2025-01-20
-- Purpose: Fix circular dependencies in assignments and grades that reference profiles, classes, and enrollments
-- Solution: Use security definer functions instead of direct profile/class/enrollment checks

-- ============================================================================
-- Fix assignments table RLS policies
-- ============================================================================

-- Drop existing assignments policies
DROP POLICY IF EXISTS "assignments_teacher_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_student_read" ON public.assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.assignments;
DROP POLICY IF EXISTS "Teachers manage class assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students read class assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;

-- Admin policy using security definer function
CREATE POLICY "Admins manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Teachers can manage assignments for their classes (using security definer function)
CREATE POLICY "Teachers manage class assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()));

-- Students can view published assignments for their enrolled classes (using security definer function)
CREATE POLICY "Students read class assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    (published = true OR published IS NULL)
    AND public.is_enrolled_in_class(class_id, auth.uid())
  );

-- ============================================================================
-- Fix grades table RLS policies
-- ============================================================================

-- Drop existing grades policies
DROP POLICY IF EXISTS "grades_teacher_all" ON public.grades;
DROP POLICY IF EXISTS "grades_student_read" ON public.grades;
DROP POLICY IF EXISTS "grades_admin_all" ON public.grades;
DROP POLICY IF EXISTS "Teachers manage grades" ON public.grades;
DROP POLICY IF EXISTS "Students read own grades" ON public.grades;
DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;

-- Create helper function to check if user is teacher for an assignment's class
CREATE OR REPLACE FUNCTION public.is_assignment_teacher(assignment_id_param uuid, teacher_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.classes c ON c.id = a.class_id
    WHERE a.id = assignment_id_param
    AND c.teacher_id = teacher_id_param
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_assignment_teacher TO authenticated;

-- Admin policy using security definer function
CREATE POLICY "Admins manage grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Teachers can manage grades for assignments in their classes (using security definer function)
CREATE POLICY "Teachers manage grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (public.is_assignment_teacher(assignment_id, auth.uid()));

-- Students can view their own grades (direct check, no joins needed)
CREATE POLICY "Students read own grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- ============================================================================
-- Fix assignment_categories table RLS policies
-- ============================================================================

-- Drop existing assignment_categories policies
DROP POLICY IF EXISTS "assignment_categories_teacher_all" ON public.assignment_categories;
DROP POLICY IF EXISTS "assignment_categories_student_read" ON public.assignment_categories;
DROP POLICY IF EXISTS "assignment_categories_admin_all" ON public.assignment_categories;
DROP POLICY IF EXISTS "Teachers manage assignment_categories for their classes" ON public.assignment_categories;
DROP POLICY IF EXISTS "Students read assignment_categories" ON public.assignment_categories;
DROP POLICY IF EXISTS "Admins manage all assignment_categories" ON public.assignment_categories;

-- Admin policy using security definer function
CREATE POLICY "Admins manage assignment_categories"
  ON public.assignment_categories FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Teachers can manage categories for their classes (using security definer function)
CREATE POLICY "Teachers manage assignment_categories"
  ON public.assignment_categories FOR ALL
  TO authenticated
  USING (public.is_class_teacher(class_id, auth.uid()));

-- Students can view categories for their enrolled classes (using security definer function)
CREATE POLICY "Students read assignment_categories"
  ON public.assignment_categories FOR SELECT
  TO authenticated
  USING (public.is_enrolled_in_class(class_id, auth.uid()));

-- Add comments for documentation
COMMENT ON FUNCTION public.is_assignment_teacher IS 
  'Security definer function to check if user is teacher for an assignment without triggering RLS recursion';

COMMENT ON POLICY "Admins manage assignments" ON public.assignments IS 
  'Admins can manage all assignments using security definer function';

COMMENT ON POLICY "Teachers manage class assignments" ON public.assignments IS 
  'Teachers can manage assignments for their classes using security definer function to prevent recursion';

COMMENT ON POLICY "Students read class assignments" ON public.assignments IS 
  'Students can read published assignments for their enrolled classes using security definer function';

COMMENT ON POLICY "Admins manage grades" ON public.grades IS 
  'Admins can manage all grades using security definer function';

COMMENT ON POLICY "Teachers manage grades" ON public.grades IS 
  'Teachers can manage grades for their classes using security definer function to prevent recursion';

COMMENT ON POLICY "Students read own grades" ON public.grades IS 
  'Students can read their own grades using direct student_id check';
