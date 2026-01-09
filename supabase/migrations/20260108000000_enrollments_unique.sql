-- Add unique constraint to enrollments table
-- This ensures a student can only be enrolled once per class

DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'enrollments_student_class_unique'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_student_class_unique 
    UNIQUE (student_id, class_id);
  END IF;

  -- Add class_id foreign key if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'enrollments_class_id_fkey'
  ) THEN
    ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;
