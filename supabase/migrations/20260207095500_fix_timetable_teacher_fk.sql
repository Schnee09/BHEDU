-- Fix: Add missing FK for timetable_slots.teacher_id
-- Date: 2026-02-07
-- Issue: PGRST200: Could not find a relationship between 'timetable_slots' and 'profiles'

DO $$ 
BEGIN
  -- 1. Ensure column exists (it should, but safety first)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timetable_slots' AND column_name = 'teacher_id'
  ) THEN
    
    -- 2. Add FK if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'timetable_slots_teacher_id_fkey'
    ) THEN
        ALTER TABLE public.timetable_slots 
        ADD CONSTRAINT timetable_slots_teacher_id_fkey 
        FOREIGN KEY (teacher_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added constraint: timetable_slots_teacher_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint timetable_slots_teacher_id_fkey already exists';
    END IF;

  ELSE
    RAISE NOTICE 'Column teacher_id not found in timetable_slots';
  END IF;

END $$;
