-- Migration: Global Schema Optimization Phase 1 - Enums & Audit Foundation
-- Created: 2026-02-05
-- Purpose: Standardize ENUMs and add audit/soft-delete columns across the entire database

-- ============================================
-- PHASE 1: CREATE STANDARD ENUM TYPES
-- ============================================

-- Attendance Status
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused', 'half_day');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment Status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Invoice Status
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Class Status
DO $$ BEGIN
  CREATE TYPE class_status AS ENUM ('active', 'completed', 'cancelled', 'upcoming');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enrollment Status
DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('enrolled', 'completed', 'dropped', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PHASE 2: ADD AUDIT & SOFT-DELETE COLUMNS
-- ============================================

-- Function to add standard audit columns to a table
CREATE OR REPLACE FUNCTION add_audit_columns(target_table TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = target_table) THEN
    RETURN;
  END IF;

  -- Add deleted_at for soft deletes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = target_table AND column_name = 'deleted_at') THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN deleted_at TIMESTAMPTZ', target_table);
  END IF;

  -- Add created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = target_table AND column_name = 'created_by') THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL', target_table);
  END IF;

  -- Add updated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = target_table AND column_name = 'updated_by') THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL', target_table);
  END IF;

  -- Ensure updated_at exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = target_table AND column_name = 'updated_at') THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()', target_table);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to core tables
SELECT add_audit_columns('profiles');
SELECT add_audit_columns('teacher_profiles');
SELECT add_audit_columns('student_profiles');
SELECT add_audit_columns('subjects');
SELECT add_audit_columns('courses');
SELECT add_audit_columns('classes');
SELECT add_audit_columns('enrollments');
SELECT add_audit_columns('attendance');
SELECT add_audit_columns('timetable_slots');
SELECT add_audit_columns('invoices');
SELECT add_audit_columns('payments');
SELECT add_audit_columns('assignments');
SELECT add_audit_columns('semesters');

-- Clean up the helper function
DROP FUNCTION add_audit_columns(TEXT);

-- ============================================
-- PHASE 3: SOFT DELETE TRIGGERS (OPTIONAL TRANSITION)
-- ============================================

-- View for "Active Only" filters can be created in later phases
-- For now, we just add the columns to ensure they are available for the API.

-- ============================================
-- PHASE 4: UPDATE CONSTRAINTS TO USE ENUMS
-- ============================================

-- This will be handled in Phase 2/3 to avoid breaking existing data 
-- without proper casting and validation.

-- ============================================
-- DONE
-- ============================================
SELECT 'Global Optimization Phase 1: Infrastructure complete!' AS status;
