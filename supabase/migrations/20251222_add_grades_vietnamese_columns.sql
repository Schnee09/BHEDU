-- Migration: Add missing columns to grades table for Vietnamese grade entry
-- Created: 2025-12-22
-- Fixes: Adds component_type, semester, academic_year_id, points_earned columns

DO $$
BEGIN
  -- Add points_earned column if not exists (Vietnamese grading uses 0-10 scale)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN points_earned numeric;
    -- Copy existing score values to points_earned
    UPDATE public.grades SET points_earned = score WHERE score IS NOT NULL;
    RAISE NOTICE 'Added column: points_earned';
  END IF;

  -- Add component_type column if not exists (oral, fifteen_min, one_period, midterm, final)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'component_type'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN component_type text;
    RAISE NOTICE 'Added column: component_type';
  END IF;

  -- Add semester column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'semester'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN semester text;
    RAISE NOTICE 'Added column: semester';
  END IF;

  -- Add academic_year_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'academic_year_id'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
    RAISE NOTICE 'Added column: academic_year_id';
  END IF;
END $$;
