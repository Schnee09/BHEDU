-- ===========================================
-- FIX STUDENT RLS POLICIES
-- Adds missing select policies for students to view their own classes and enrollments
-- ===========================================

-- 1. Classes: Allow students to view classes they are enrolled in
DROP POLICY IF EXISTS "Students view enrolled classes" ON public.classes;
CREATE POLICY "Students view enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT class_id FROM enrollments
      WHERE student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 2. Enrollments: Allow students to view their own enrollments
DROP POLICY IF EXISTS "Students view own enrollments" ON public.enrollments;
CREATE POLICY "Students view own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 3. Profiles: (Optional but good) Ensure students can view the profiles of teachers for their classes
-- This is often needed for UI displaying teacher names in class lists
DROP POLICY IF EXISTS "Students view their teachers" ON public.profiles;
CREATE POLICY "Students view their teachers"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT teacher_id FROM classes
      WHERE id IN (
        SELECT class_id FROM enrollments
        WHERE student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );
