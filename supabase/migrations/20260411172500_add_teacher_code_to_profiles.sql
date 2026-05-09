-- Migration: Add teacher_code to profiles table
-- Created at: 2026-04-11

-- 1. Add teacher_code column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS teacher_code TEXT;

-- 2. Add unique constraint (optional but recommended for UIDs)
-- We use a partial index to allow multiple NULLs but unique values if present
CREATE UNIQUE INDEX IF NOT EXISTS profiles_teacher_code_idx ON public.profiles (teacher_code) WHERE teacher_code IS NOT NULL;

-- 3. Update RLS (if needed, but profiles usually has broad enough RLS for admins)
-- Assuming existing RLS allows admins to manage all columns.

COMMENT ON COLUMN public.profiles.teacher_code IS 'UID (Mã truy cập) for Teachers, Staff, and Tutors';
