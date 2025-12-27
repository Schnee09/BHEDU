-- Migration: Fix Profile RLS Policies
-- Created: 2025-12-27
-- Purpose: Fix profile fetch issue after teacher RLS policies were applied

-- ============================================
-- FIX: ENSURE USER CAN ALWAYS VIEW OWN PROFILE
-- ============================================

-- Drop the problematic policy that may be causing conflicts
DROP POLICY IF EXISTS "Teachers can view students in own classes" ON public.profiles;

-- Recreate with simpler logic that checks own profile FIRST
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Separate policy for staff/admin to view all
CREATE POLICY "Staff can view all profiles v2"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Separate policy for teachers to view their students
CREATE POLICY "Teachers can view enrolled students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'teacher'
    AND role = 'student'
    AND id IN (
      SELECT e.student_id 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
        AND e.status = 'active'
    )
  );

-- ============================================
-- DONE
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'Profile RLS policies fixed!' AS status;
