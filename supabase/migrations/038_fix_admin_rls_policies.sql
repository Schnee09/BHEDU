-- Fix missing admin RLS policies
-- Migration 006 dropped admin policies to fix circular dependencies but never recreated them
-- This migration restores admin access using a helper function

------------------------------------------------------------
-- Create helper function to check if user is admin (if not exists)
------------------------------------------------------------
-- Note: This function may already exist from migration 20251120_fix_infinite_recursion.sql
-- We use CREATE OR REPLACE to handle both cases
DO $$
BEGIN
  -- Only create if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    CREATE FUNCTION public.is_admin()
    RETURNS BOOLEAN AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
  END IF;
END $$;

------------------------------------------------------------
-- CLASSES - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all classes" ON classes;
CREATE POLICY "Admins manage all classes"
  ON classes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- ENROLLMENTS - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
CREATE POLICY "Admins manage enrollments"
  ON enrollments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- ASSIGNMENTS - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage assignments" ON assignments;
CREATE POLICY "Admins manage assignments"
  ON assignments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- SUBMISSIONS - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage submissions" ON submissions;
CREATE POLICY "Admins manage submissions"
  ON submissions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- SCORES - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all scores" ON scores;
CREATE POLICY "Admins manage all scores"
  ON scores FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- ATTENDANCE - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all attendance" ON attendance;
CREATE POLICY "Admins manage all attendance"
  ON attendance FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- GRADES - Add admin policy (if table exists)
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all grades" ON grades;
CREATE POLICY "Admins manage all grades"
  ON grades FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- ACADEMIC_YEARS - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage academic_years" ON academic_years;
CREATE POLICY "Admins manage academic_years"
  ON academic_years FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow everyone to read current academic year
DROP POLICY IF EXISTS "Everyone can view academic_years" ON academic_years;
CREATE POLICY "Everyone can view academic_years"
  ON academic_years FOR SELECT
  USING (auth.uid() IS NOT NULL);

------------------------------------------------------------
-- CONDUCT_GRADES - Add admin policy (Vietnamese education feature)
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage conduct_grades" ON conduct_grades;
CREATE POLICY "Admins manage conduct_grades"
  ON conduct_grades FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

------------------------------------------------------------
-- GRADE_COMPONENT_CONFIGS - Add admin policy (Vietnamese education feature)
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage grade_component_configs" ON grade_component_configs;
CREATE POLICY "Admins manage grade_component_configs"
  ON grade_component_configs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow teachers to read component configs for their grades
DROP POLICY IF EXISTS "Teachers view grade_component_configs" ON grade_component_configs;
CREATE POLICY "Teachers view grade_component_configs"
  ON grade_component_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

------------------------------------------------------------
-- NOTIFICATIONS - Add admin policy
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;
CREATE POLICY "Admins manage notifications"
  ON notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
