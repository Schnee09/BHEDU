-- Migration: Add missing foreign key constraints
-- Created: 2025-12-22
-- Fixes: enrollments.class_id and attendance.class_id FK constraints
-- Purpose: Enforce referential integrity to prevent orphaned data

DO $$
BEGIN
  -- 1. Add FK constraint for enrollments.class_id -> classes.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'enrollments_class_id_fkey'
    AND table_name = 'enrollments'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES public.classes(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added FK constraint: enrollments_class_id_fkey';
  ELSE
    RAISE NOTICE 'FK constraint enrollments_class_id_fkey already exists';
  END IF;

  -- 2. Add FK constraint for attendance.class_id -> classes.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_class_id_fkey'
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE public.attendance 
    ADD CONSTRAINT attendance_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES public.classes(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added FK constraint: attendance_class_id_fkey';
  ELSE
    RAISE NOTICE 'FK constraint attendance_class_id_fkey already exists';
  END IF;
END $$;
