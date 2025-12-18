-- Add subject classification for Vietnamese education system
-- This migration adds subject_type column to classify subjects as core, elective, or specialized

DO $$
BEGIN
  -- Add subject_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'subject_type'
  ) THEN
    ALTER TABLE public.subjects
    ADD COLUMN subject_type text DEFAULT 'core'
    CHECK (subject_type IN ('core', 'elective', 'specialized'));

    -- Add comment
    COMMENT ON COLUMN public.subjects.subject_type IS 'Subject classification: core (required), elective (optional), specialized (program-specific)';
  END IF;
END $$;