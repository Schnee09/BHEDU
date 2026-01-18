-- Migration: Add timetable_slot_id to attendance table
-- Created: 2026-01-17
-- Purpose: Link attendance records to specific timetable slots

DO $$
BEGIN
  -- Add timetable_slot_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance' 
    AND column_name = 'timetable_slot_id'
  ) THEN
    ALTER TABLE public.attendance 
    ADD COLUMN timetable_slot_id uuid REFERENCES public.timetable_slots(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added column: timetable_slot_id to attendance';
  END IF;
END
$$;

-- Create index for faster lookups by slot
CREATE INDEX IF NOT EXISTS idx_attendance_slot_id ON public.attendance(timetable_slot_id);

-- Log success
SELECT 'Attendance timetable linking migration completed' AS status;
