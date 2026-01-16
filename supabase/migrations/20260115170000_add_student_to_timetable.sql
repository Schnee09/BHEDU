-- Migration: Add student_id to timetable_slots
-- Created: 2026-01-15
-- Purpose: Track individual students in tutoring sessions (Học kèm)

-- 1. Add student_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timetable_slots' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.timetable_slots ADD COLUMN student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added column: student_id to timetable_slots';
  END IF;
END $$;

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_timetable_student ON public.timetable_slots(student_id);

-- 3. Update RLS (Policies should already cover it if they use `timetable_slots` generally, but let's be sure)
-- Policies are already defined for the table as a whole in previous migrations.
