-- Migration: Fix infinite recursion in RLS policies
-- Date: 2025-11-20
-- Issue: Policies querying profiles table cause infinite recursion
-- Solution: Use security definer function that bypasses RLS

------------------------------------------------------------
-- 1. Create security definer function (if not exists)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

------------------------------------------------------------
-- 2. Fix profiles table policies
------------------------------------------------------------
-- Drop all recursive policies on profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles (fn)" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read teacher profiles" ON public.profiles;

-- Admins can read all profiles (using security definer function)
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow reading teacher/admin profiles (for class displays, etc.)
CREATE POLICY "Read teacher profiles"
  ON public.profiles FOR SELECT
  USING (role IN ('teacher', 'admin'));

-- Teachers can read student profiles in their classes
CREATE POLICY "Teachers read student profiles"
  ON public.profiles FOR SELECT
  USING (
    role = 'student' AND EXISTS (
      SELECT 1 FROM enrollments e
      INNER JOIN classes c ON e.class_id = c.id
      WHERE e.student_id = profiles.id
        AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- 3. Fix classes table policies
------------------------------------------------------------
-- Ensure RLS is enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate admin policies using security definer function
DROP POLICY IF EXISTS "Admins manage all classes" ON public.classes;
CREATE POLICY "Admins manage all classes"
  ON public.classes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Teachers can read their own classes
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
CREATE POLICY "Teachers read own classes"
  ON public.classes FOR SELECT
  USING (teacher_id = auth.uid());

-- Students can read classes they're enrolled in
DROP POLICY IF EXISTS "Students read enrolled classes" ON public.classes;
CREATE POLICY "Students read enrolled classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE class_id = classes.id
      AND student_id = auth.uid()
    )
  );

------------------------------------------------------------
-- 4. Fix enrollments policies
------------------------------------------------------------
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
CREATE POLICY "Teachers read class enrollments"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = enrollments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;
CREATE POLICY "Students read own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

------------------------------------------------------------
-- 5. Fix assignments policies
------------------------------------------------------------
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
CREATE POLICY "Admins manage assignments"
  ON public.assignments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage class assignments" ON public.assignments;
CREATE POLICY "Teachers manage class assignments"
  ON public.assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read class assignments" ON public.assignments;
CREATE POLICY "Students read class assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = assignments.class_id
      AND enrollments.student_id = auth.uid()
    )
  );

------------------------------------------------------------
-- 6. Fix grades policies
------------------------------------------------------------
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
DROP POLICY IF EXISTS "grades_admin_all" ON public.grades;
CREATE POLICY "Admins manage grades"
  ON public.grades
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage class grades" ON public.grades;
DROP POLICY IF EXISTS "grades_teacher_all" ON public.grades;
CREATE POLICY "Teachers manage class grades"
  ON public.grades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      INNER JOIN classes c ON a.class_id = c.id
      WHERE a.id = grades.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own grades" ON public.grades;
DROP POLICY IF EXISTS "grades_student_read" ON public.grades;
CREATE POLICY "Students read own grades"
  ON public.grades FOR SELECT
  USING (student_id = auth.uid());

------------------------------------------------------------
-- 7. Fix attendance policies
------------------------------------------------------------
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
CREATE POLICY "Admins manage attendance"
  ON public.attendance
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage class attendance" ON public.attendance;
CREATE POLICY "Teachers manage class attendance"
  ON public.attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = attendance.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own attendance" ON public.attendance;
CREATE POLICY "Students read own attendance"
  ON public.attendance FOR SELECT
  USING (student_id = auth.uid());

------------------------------------------------------------
-- Comments
------------------------------------------------------------
COMMENT ON FUNCTION public.is_admin IS 'Security definer function to check admin role without RLS recursion';

