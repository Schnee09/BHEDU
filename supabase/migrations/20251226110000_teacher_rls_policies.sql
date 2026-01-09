-- Migration: RLS Policies for Teacher Access Control
-- Created: 2025-12-26
-- Purpose: Teachers can only view students/grades in their own classes

-- ============================================
-- TEACHER: VIEW OWN CLASSES ONLY
-- ============================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;

-- Teachers can only view classes they teach
CREATE POLICY "Teachers can view own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    -- Staff/Admin can see all (handled by separate policy)
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      -- Teachers can only see their own classes
      public.get_current_user_role() = 'teacher'
      AND teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================
-- TEACHER: VIEW STUDENTS IN OWN CLASSES ONLY
-- ============================================

-- Drop old policy if exists  
DROP POLICY IF EXISTS "Teachers can view students in own classes" ON public.profiles;

-- Teachers can view student profiles only if enrolled in their classes
CREATE POLICY "Teachers can view students in own classes"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    -- Staff/Admin can see all (handled by separate policy)
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      -- Users can see their own profile
      user_id = auth.uid()
    )
    OR (
      -- Teachers can see students enrolled in their classes
      public.get_current_user_role() = 'teacher'
      AND role = 'student'
      AND id IN (
        SELECT e.student_id 
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        WHERE c.teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
          AND e.status = 'active'
      )
    )
  );

-- ============================================
-- TEACHER: MANAGE GRADES IN OWN CLASSES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Teachers can view own class grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can manage grades in own classes" ON public.grades;

-- Teachers can view grades for their classes
CREATE POLICY "Teachers can view own class grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
    OR (
      -- Students can see their own grades
      public.get_current_user_role() = 'student'
      AND student_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Teachers can insert grades for their classes
CREATE POLICY "Teachers can insert grades in own classes"
  ON public.grades FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  );

-- Teachers can update grades for their classes
CREATE POLICY "Teachers can update grades in own classes"
  ON public.grades FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  )
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  );

-- Teachers can delete grades for their classes
CREATE POLICY "Teachers can delete grades in own classes"
  ON public.grades FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  );

-- ============================================
-- TEACHER: VIEW/MANAGE ATTENDANCE IN OWN CLASSES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own class attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance in own classes" ON public.attendance;

CREATE POLICY "Teachers can view own class attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
    OR (
      -- Students can see their own attendance
      public.get_current_user_role() = 'student'
      AND student_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Teachers can manage attendance in own classes"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  )
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
  );

-- ============================================
-- TEACHER: VIEW ENROLLMENTS FOR OWN CLASSES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own class enrollments" ON public.enrollments;

CREATE POLICY "Teachers can view own class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    OR (
      public.get_current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM classes 
        WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      )
    )
    OR (
      -- Students can see their own enrollments
      public.get_current_user_role() = 'student'
      AND student_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================
-- TUITION CONFIG: STAFF/ADMIN ONLY
-- ============================================

ALTER TABLE public.tuition_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tuition config"
  ON public.tuition_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage tuition config"
  ON public.tuition_config FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

-- ============================================
-- DONE
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'RLS Policies updated for teacher access control!' AS status;
