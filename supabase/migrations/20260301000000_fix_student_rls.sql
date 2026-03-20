-- ===========================================
-- FIX STUDENT RLS POLICIES
-- Adds missing select policies for students to view their own classes and enrollments
-- ===========================================

-- 1. Classes: Allow students to view classes they are enrolled in
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Students view enrolled classes' 
        AND polrelid = 'public.classes'::regclass
    ) THEN
        CREATE POLICY "Students view enrolled classes"
          ON public.classes FOR SELECT
          TO authenticated
          USING (
            id IN (
              SELECT class_id FROM enrollments
              WHERE student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
            )
          );
    END IF;
END $$;

-- 2. Enrollments: Allow students to view their own enrollments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Students view own enrollments' 
        AND polrelid = 'public.enrollments'::regclass
    ) THEN
        CREATE POLICY "Students view own enrollments"
          ON public.enrollments FOR SELECT
          TO authenticated
          USING (
            student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
          );
    END IF;
END $$;

-- 3. Profiles: Allow students to view the profiles of teachers for their classes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Students view their teachers' 
        AND polrelid = 'public.profiles'::regclass
    ) THEN
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
    END IF;
END $$;
