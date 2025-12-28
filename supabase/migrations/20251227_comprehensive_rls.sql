-- ============================================
-- BH-EDU COMPREHENSIVE RLS POLICIES
-- Run this to ensure all tables have proper RLS
-- ============================================

-- ===========================================
-- PROFILES TABLE
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (old and new names)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Staff/Admin can view all profiles  
CREATE POLICY "Staff view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff', 'teacher')
    )
  );

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ===========================================
-- CLASSES TABLE
-- ===========================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers view own classes" ON public.classes;
DROP POLICY IF EXISTS "Staff manage classes" ON public.classes;
DROP POLICY IF EXISTS "Staff view all classes" ON public.classes;

-- Staff/Admin can view all classes
CREATE POLICY "Staff view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- Teachers can view classes they teach
CREATE POLICY "Teachers view own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Staff/Admin can manage classes
CREATE POLICY "Staff manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- ===========================================
-- ENROLLMENTS TABLE
-- ===========================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers view class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Staff manage enrollments" ON public.enrollments;

-- Teachers can view enrollments for their classes
CREATE POLICY "Teachers view class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM classes 
      WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- Staff/Admin can manage
CREATE POLICY "Staff manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- ===========================================
-- GRADES TABLE
-- ===========================================
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View grades" ON public.grades;
DROP POLICY IF EXISTS "Manage grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers manage class grades" ON public.grades;
DROP POLICY IF EXISTS "Students view own grades" ON public.grades;

-- Teachers can view/edit grades for their classes
CREATE POLICY "Teachers manage class grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM classes 
      WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- Students can view their own grades
CREATE POLICY "Students view own grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ===========================================
-- ATTENDANCE TABLE
-- ===========================================
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View attendance" ON public.attendance;
DROP POLICY IF EXISTS "Manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers manage class attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students view own attendance" ON public.attendance;

-- Teachers can manage attendance for their classes
CREATE POLICY "Teachers manage class attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM classes 
      WHERE teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students view own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ===========================================
-- SUBJECTS TABLE (Read-only for most)
-- ===========================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;

CREATE POLICY "Authenticated view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.classes TO authenticated;
GRANT SELECT ON public.enrollments TO authenticated;
GRANT SELECT ON public.grades TO authenticated;
GRANT SELECT ON public.attendance TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
