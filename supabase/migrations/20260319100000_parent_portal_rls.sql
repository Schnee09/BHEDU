
-- Migration: Parent Portal RLS & Attendance Fix
-- Created: 2026-03-19
-- Purpose: 
-- 1. Grant Parents access to linked students' data (RLS)
-- 2. Fix missing Attendance policies from previous migrations
-- 3. Ensure Financial data is visible to linked Parents

-- ============================================
-- 1. SECURITY DEFINER HELPERS
-- ============================================

-- Function: Check if current user is parent of target student
CREATE OR REPLACE FUNCTION public.is_parent_of_student(target_student_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_id = public.get_current_profile_id()
    AND student_id = target_student_id
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. ATTENDANCE RLS (Was missing in Nuke & Pave)
-- ============================================

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance_Staff_All" ON public.attendance;
CREATE POLICY "Attendance_Staff_All" ON public.attendance 
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

DROP POLICY IF EXISTS "Attendance_Teacher_Manage" ON public.attendance;
CREATE POLICY "Attendance_Teacher_Manage" ON public.attendance 
  FOR ALL TO authenticated 
  USING (public.is_teacher_of_class(class_id))
  WITH CHECK (public.is_teacher_of_class(class_id));

DROP POLICY IF EXISTS "Attendance_Student_View" ON public.attendance;
CREATE POLICY "Attendance_Student_View" ON public.attendance 
  FOR SELECT TO authenticated 
  USING (student_id = public.get_current_profile_id());

DROP POLICY IF EXISTS "Attendance_Parent_View" ON public.attendance;
CREATE POLICY "Attendance_Parent_View" ON public.attendance 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- ============================================
-- 3. GRADES RLS (Add Parent View)
-- ============================================

DROP POLICY IF EXISTS "Grades_Parent_View" ON public.grades;
CREATE POLICY "Grades_Parent_View" ON public.grades 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- ============================================
-- 4. ENROLLMENTS RLS (Add Parent View)
-- ============================================

DROP POLICY IF EXISTS "Enrollments_Parent_View" ON public.enrollments;
CREATE POLICY "Enrollments_Parent_View" ON public.enrollments 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- ============================================
-- 5. PROFILES RLS (Add Parent View for linked students)
-- ============================================

DROP POLICY IF EXISTS "Profiles_Parent_View_Child" ON public.profiles;
CREATE POLICY "Profiles_Parent_View_Child" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_parent_of_student(id));

-- ============================================
-- 6. FINANCE RLS (student_accounts, invoices, payments)
-- ============================================

-- student_accounts
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance_Staff_Manage" ON public.student_accounts;
CREATE POLICY "Finance_Staff_Manage" ON public.student_accounts 
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'));

DROP POLICY IF EXISTS "Finance_Student_View" ON public.student_accounts;
CREATE POLICY "Finance_Student_View" ON public.student_accounts 
  FOR SELECT TO authenticated 
  USING (student_id = public.get_current_profile_id());

DROP POLICY IF EXISTS "Finance_Parent_View" ON public.student_accounts;
CREATE POLICY "Finance_Parent_View" ON public.student_accounts 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoices_Staff_Manage" ON public.invoices;
CREATE POLICY "Invoices_Staff_Manage" ON public.invoices 
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'));

DROP POLICY IF EXISTS "Invoices_Student_View" ON public.invoices;
CREATE POLICY "Invoices_Student_View" ON public.invoices 
  FOR SELECT TO authenticated 
  USING (student_id = public.get_current_profile_id());

DROP POLICY IF EXISTS "Invoices_Parent_View" ON public.invoices;
CREATE POLICY "Invoices_Parent_View" ON public.invoices 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments_Staff_Manage" ON public.payments;
CREATE POLICY "Payments_Staff_Manage" ON public.payments 
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin'));

DROP POLICY IF EXISTS "Payments_Student_View" ON public.payments;
CREATE POLICY "Payments_Student_View" ON public.payments 
  FOR SELECT TO authenticated 
  USING (student_id = public.get_current_profile_id());

DROP POLICY IF EXISTS "Payments_Parent_View" ON public.payments;
CREATE POLICY "Payments_Parent_View" ON public.payments 
  FOR SELECT TO authenticated 
  USING (public.is_parent_of_student(student_id));

-- ============================================
-- 7. REFRESH
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'Parent Portal RLS established' as status;
