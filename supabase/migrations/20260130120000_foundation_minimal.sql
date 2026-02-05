-- Migration: Foundation - ENUMs and RLS Functions (Minimal Version)
-- Created: 2026-01-30
-- Purpose: Add type safety with ENUMs and RLS helper functions

-- ============================================
-- PHASE 1: CREATE ENUMS FOR TYPE SAFETY
-- ============================================

-- User role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'owner', 
    'admin',
    'staff',
    'teacher',
    'tutor',
    'parent',
    'student'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Grade component enum (Vietnamese education system)
DO $$ BEGIN
  CREATE TYPE grade_component AS ENUM (
    'oral',          -- Kiểm tra miệng
    'fifteen_min',   -- Kiểm tra 15 phút
    'one_period',    -- Kiểm tra 1 tiết
    'midterm',       -- Giữa kỳ
    'final'          -- Cuối kỳ
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Attendance status enum
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Invoice status enum
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft',
    'pending',
    'paid',
    'overdue',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enrollment status enum
DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM (
    'active',
    'inactive',
    'completed',
    'dropped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PHASE 2: UNIFIED RLS HELPER FUNCTIONS
-- ============================================

-- Create a role hierarchy checker that works with ENUMs
CREATE OR REPLACE FUNCTION public.has_role_level(required_level text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_hierarchy jsonb := '{
    "super_admin": 8,
    "owner": 7,
    "admin": 6,
    "staff": 5,
    "teacher": 4,
    "tutor": 3,
    "parent": 2,
    "student": 1
  }'::jsonb;
BEGIN
  -- Get current user's role
  SELECT role::text INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If no role found, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user's role level >= required level
  RETURN (role_hierarchy->>user_role)::int >= 
         (role_hierarchy->>required_level)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Parameterized version for API middleware
CREATE OR REPLACE FUNCTION public.has_role_level(uid uuid, required_level text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_hierarchy jsonb := '{
    "super_admin": 8,
    "owner": 7,
    "admin": 6,
    "staff": 5,
    "teacher": 4,
    "tutor": 3,
    "parent": 2,
    "student": 1
  }'::jsonb;
BEGIN
  -- Get specified user's role
  SELECT role::text INTO user_role 
  FROM public.profiles 
  WHERE user_id = uid
  LIMIT 1;
  
  -- If no role found, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user's role level >= required level
  RETURN (role_hierarchy->>user_role)::int >= 
         (role_hierarchy->>required_level)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to check if user is in their own classes (for teachers)
CREATE OR REPLACE FUNCTION public.user_teaches_class(class_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_id_param
    AND teacher_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to check if user is enrolled in class (for students)
CREATE OR REPLACE FUNCTION public.user_enrolled_in_class(class_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.class_id = class_id_param
    AND p.user_id = auth.uid()
    AND e.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- DONE
-- ============================================

SELECT 'Foundation migration complete! ENUMs created, RLS helpers ready.' AS status;
