-- Migration: Comprehensive Superadmin Permission Fix
-- Created: 2026-01-30
-- Purpose: Grant unrestricted access to super_admin and owner roles across all system functions and RLS policies.

-- ============================================
-- PHASE 1: FIX CORE PERMISSION FUNCTIONS
-- ============================================

-- THIS IS THE CRITICAL FIX!
-- The get_current_user_role() function is used by ALL RLS policies.
-- Old policies only check for 'admin' and 'staff', not 'super_admin' or 'owner'.
-- We normalize super_admin/owner -> 'admin' for backward compatibility with existing policies.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Normalize high-privilege roles to 'admin' for backward-compatible RLS checks
  IF v_role IN ('super_admin', 'owner') THEN
    RETURN 'admin';
  END IF;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also provide a function that returns the ACTUAL role (for UI display, etc.)
CREATE OR REPLACE FUNCTION public.get_actual_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_permission_code VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR(20);
  v_has_permission BOOLEAN := false;
  v_is_denied BOOLEAN := false;
BEGIN
  -- Get user's role from profile ID
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  -- super_admin, owner, and admin have all permissions
  IF v_role IN ('super_admin', 'owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Check if explicitly denied for this user
  SELECT is_denied INTO v_is_denied
  FROM public.user_permissions
  WHERE user_id = p_user_id 
    AND permission_code = p_permission_code
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_is_denied = true THEN
    RETURN false;
  END IF;
  
  -- Check custom user permission
  SELECT true INTO v_has_permission
  FROM public.user_permissions
  WHERE user_id = p_user_id 
    AND permission_code = p_permission_code
    AND is_denied = false
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_has_permission THEN
    RETURN true;
  END IF;
  
  -- Check role default permission
  SELECT true INTO v_has_permission
  FROM public.role_permissions
  WHERE role = v_role 
    AND permission_code = p_permission_code;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission_code VARCHAR(100), source VARCHAR(20)) AS $$
DECLARE
  v_role VARCHAR(20);
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  -- super_admin, owner, and admin have all permissions
  IF v_role IN ('super_admin', 'owner', 'admin') THEN
    RETURN QUERY
    SELECT pd.code, v_role::VARCHAR(20)
    FROM public.permission_definitions pd;
    RETURN;
  END IF;
  
  -- Return role permissions
  RETURN QUERY
  SELECT rp.permission_code, 'role'::VARCHAR(20)
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  
  -- Add custom user permissions (not denied)
  RETURN QUERY
  SELECT up.permission_code, 'custom'::VARCHAR(20)
  FROM public.user_permissions up
  WHERE up.user_id = p_user_id
    AND up.is_denied = false
    AND (up.expires_at IS NULL OR up.expires_at > now())
    AND up.permission_code NOT IN (
      SELECT rp.permission_code FROM public.role_permissions rp WHERE rp.role = v_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 2: DEFINE NEW SECURITY HELPERS
-- ============================================

-- Unified check for high-level operations (admin or above) - NO PARAMS version for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parameterized version for API middleware - checks if a specific user is admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE user_id = uid LIMIT 1;
  RETURN v_role IN ('super_admin', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unified check for staff operations (staff or above) - NO PARAMS version for RLS
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parameterized version for API middleware - checks if a specific user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher(uid uuid)
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE user_id = uid LIMIT 1;
  RETURN v_role IN ('super_admin', 'owner', 'admin', 'staff', 'teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 3: REFRESH CRITICAL RLS POLICIES
-- ============================================

-- 1. Profiles
DO $$ BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin staff all profiles" ON public.profiles;
    CREATE POLICY "Admin staff all profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

-- 2. Classes
DO $$ BEGIN
  IF to_regclass('public.classes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
    DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
    CREATE POLICY "Admins manage classes" ON public.classes
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 3. Courses
DO $$ BEGIN
  IF to_regclass('public.courses') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
    DROP POLICY IF EXISTS "Staff can manage courses" ON public.courses;
    CREATE POLICY "Admins manage courses" ON public.courses
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 4. Subjects
DO $$ BEGIN
  IF to_regclass('public.subjects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can manage subjects" ON public.subjects;
    DROP POLICY IF EXISTS "Admin manage subjects" ON public.subjects;
    DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
    CREATE POLICY "Admins manage subjects" ON public.subjects
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 5. Academic Features (Semesters, Years)
DO $$ BEGIN
  IF to_regclass('public.semesters') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can manage semesters" ON public.semesters;
    DROP POLICY IF EXISTS "Admins manage semesters" ON public.semesters;
    CREATE POLICY "Admins manage semesters" ON public.semesters
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.academic_years') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can manage academic years" ON public.academic_years;
    DROP POLICY IF EXISTS "Admins manage academic years" ON public.academic_years;
    CREATE POLICY "Admins manage academic years" ON public.academic_years
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 6. Permission System tables
DO $$ BEGIN
  IF to_regclass('public.permission_definitions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin manage permission definitions" ON public.permission_definitions;
    DROP POLICY IF EXISTS "Admins manage permission definitions" ON public.permission_definitions;
    CREATE POLICY "Admins manage permission definitions" ON public.permission_definitions
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin manage role permissions" ON public.role_permissions;
    DROP POLICY IF EXISTS "Admins manage role permissions" ON public.role_permissions;
    CREATE POLICY "Admins manage role permissions" ON public.role_permissions
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.user_permissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin manage custom permissions" ON public.user_permissions;
    DROP POLICY IF EXISTS "Admins manage custom permissions" ON public.user_permissions;
    CREATE POLICY "Admins manage custom permissions" ON public.user_permissions
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- 7. Data Tables (Attendance, Grades, Enrollments)
DO $$ BEGIN
  IF to_regclass('public.attendance') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;
    DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
    CREATE POLICY "Admins manage attendance" ON public.attendance
      FOR ALL TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.grades') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff manage grades" ON public.grades;
    DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
    CREATE POLICY "Admins manage grades" ON public.grades
      FOR ALL TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.enrollments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff manage enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
    CREATE POLICY "Admins manage enrollments" ON public.enrollments
      FOR ALL TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.student_profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff manage student profiles" ON public.student_profiles;
    DROP POLICY IF EXISTS "Admins manage student profiles" ON public.student_profiles;
    CREATE POLICY "Admins manage student profiles" ON public.student_profiles
      FOR ALL TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

-- 8. Financial tables
DO $$ BEGIN
  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Admins manage invoices" ON public.invoices;
    CREATE POLICY "Admins manage invoices" ON public.invoices
      FOR ALL TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff manage payments" ON public.payments;
    DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
    CREATE POLICY "Admins manage payments" ON public.payments
      FOR ALL TO authenticated
      USING (public.is_staff());
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
SELECT 'Superadmin permission fix applied successfully!' as status;
