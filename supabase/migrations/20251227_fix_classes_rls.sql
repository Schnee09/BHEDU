-- Fix: Teacher can only see their own classes
-- Run in Supabase SQL Editor

-- Drop existing class policies
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Students view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admin staff view all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers view own classes only" ON public.classes;

-- Get teacher's profile ID function
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Admin/Staff can view ALL classes
CREATE POLICY "Admin staff view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Policy 2: Teachers can ONLY view classes where they are the teacher
CREATE POLICY "Teachers view own classes only"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'teacher'
    AND teacher_id = public.get_current_profile_id()
  );

-- Policy 3: Students can view classes they are enrolled in
CREATE POLICY "Students view enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND id IN (
      SELECT class_id FROM public.enrollments 
      WHERE student_id = public.get_current_profile_id()
      AND status = 'active'
    )
  );

-- Verify
SELECT 'Classes RLS policies updated' as status;
SELECT policyname FROM pg_policies WHERE tablename = 'classes';
