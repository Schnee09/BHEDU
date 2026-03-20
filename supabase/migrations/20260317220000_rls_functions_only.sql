
-- Migration: RLS FUNCTIONS ONLY (The "Recursive-Proof" fix)
-- Created: 2026-03-17
-- Strategy: Move all complex RLS logic into SECURITY DEFINER functions to break recursion chains.

-- ============================================
-- 1. CLEANUP OLD POLICIES (Aggressive)
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
-- 2. SAFE SECURITY DEFINER HELPER FUNCTIONS
-- ============================================

-- A. Get Role (Safe)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND deleted_at IS NULL 
  AND is_active = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- B. Get Profile ID (Safe)
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND deleted_at IS NULL 
  AND is_active = true 
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- C. Check if Student is enrolled in a class (Safe)
CREATE OR REPLACE FUNCTION public.can_student_see_class(cid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = public.get_current_profile_id() 
    AND class_id = cid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- D. Check if Student can see a teacher's profile (Safe)
CREATE OR REPLACE FUNCTION public.can_student_see_teacher(teacher_pid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.enrollments e ON c.id = e.class_id
    WHERE e.student_id = public.get_current_profile_id() 
    AND c.teacher_id = teacher_pid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- E. Check if Teacher manages a class (Safe)
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(cid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = cid AND teacher_id = public.get_current_profile_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. RECREATE POLICIES USING ONLY FUNCTIONS
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles_Select_Self" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Profiles_Select_Staff" ON public.profiles FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
CREATE POLICY "Profiles_Select_Student_Teacher" ON public.profiles FOR SELECT TO authenticated USING (public.get_current_user_role() = 'student' AND role = 'teacher' AND public.can_student_see_teacher(id));
CREATE POLICY "Profiles_Update_Self" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Profiles_Admin_All" ON public.profiles FOR ALL TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin')) WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'));

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes_Staff_All" ON public.classes FOR ALL TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')) WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
CREATE POLICY "Classes_Teacher_View" ON public.classes FOR SELECT TO authenticated USING (teacher_id = public.get_current_profile_id());
CREATE POLICY "Classes_Student_View" ON public.classes FOR SELECT TO authenticated USING (public.can_student_see_class(id));

-- ENROLLMENTS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrollments_Staff_All" ON public.enrollments FOR ALL TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')) WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
CREATE POLICY "Enrollments_Teacher_View" ON public.enrollments FOR SELECT TO authenticated USING (public.is_teacher_of_class(class_id));
CREATE POLICY "Enrollments_Student_View" ON public.enrollments FOR SELECT TO authenticated USING (student_id = public.get_current_profile_id());

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects_Select_All" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Subjects_Staff_All" ON public.subjects FOR ALL TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')) WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

-- GRADES
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grades_Staff_All" ON public.grades FOR ALL TO authenticated USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')) WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
CREATE POLICY "Grades_Teacher_Manage" ON public.grades FOR ALL TO authenticated USING (public.is_teacher_of_class(class_id)) WITH CHECK (public.is_teacher_of_class(class_id));
CREATE POLICY "Grades_Student_View" ON public.grades FOR SELECT TO authenticated USING (student_id = public.get_current_profile_id());

-- ============================================
-- 4. FINAL TOUCHES
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'Recursive-Proof RLS active' as status;
