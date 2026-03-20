
-- Migration: FINAL RLS NUKE AND PAVE
-- Created: 2026-03-17
-- Target: Eliminate all 42P17 recursion once and for all

-- ============================================
-- 1. DROP ALL POTENTIAL RECURSIVE POLICIES
-- ============================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'students', 'classes', 'enrollments', 'attendance', 'grades', 'subjects')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- 2. RE-DEFINE SECURITY DEFINER HELPERS
-- ============================================

-- Function 1: Get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  -- SECURITY DEFINER and SET search_path minimize attack surface and bypass RLS
  SELECT role FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND deleted_at IS NULL 
  AND is_active = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Function 2: Get profile ID safely
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND deleted_at IS NULL 
  AND is_active = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Function 3: Check if admin/staff safely
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function 4: Check if teacher safely
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('teacher');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. RECREATE CLEAN POLICIES (PROFILES)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles self select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Profiles staff select all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Profiles student view teachers"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND role = 'teacher'
    AND id IN (
      SELECT teacher_id FROM public.classes
      WHERE id IN (
        SELECT class_id FROM public.enrollments 
        WHERE student_id = public.get_current_profile_id()
      )
    )
  );

CREATE POLICY "Profiles self update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Profiles staff manage all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ============================================
-- 4. RECREATE CLEAN POLICIES (CLASSES)
-- ============================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes staff manage all"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Classes teacher view own"
  ON public.classes FOR SELECT
  TO authenticated
  USING (teacher_id = public.get_current_profile_id());

CREATE POLICY "Classes student view enrolled"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT class_id FROM public.enrollments 
      WHERE student_id = public.get_current_profile_id()
    )
  );

-- ============================================
-- 5. RECREATE CLEAN POLICIES (ENROLLMENTS)
-- ============================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrollments staff manage all"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Enrollments teacher view own"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE teacher_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "Enrollments student view self"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_profile_id());

-- ============================================
-- 6. RECREATE CLEAN POLICIES (SUBJECTS)
-- ============================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects authenticated select all"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Subjects staff manage all"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ============================================
-- 7. RECREATE CLEAN POLICIES (GRADES)
-- ============================================

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grades staff manage all"
  ON public.grades FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Grades teacher manage own"
  ON public.grades FOR ALL
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE teacher_id = public.get_current_profile_id()
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE teacher_id = public.get_current_profile_id()
    )
  );

CREATE POLICY "Grades student view self"
  ON public.grades FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_profile_id());

-- ============================================
-- 8. GRANT PERMISSIONS (Just in case)
-- ============================================
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.classes TO authenticated;
GRANT SELECT ON public.enrollments TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.grades TO authenticated;

SELECT 'RLS Nuke and Pave completed successfully' as status;
