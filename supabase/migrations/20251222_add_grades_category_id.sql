-- Migration: Add category_id to grades table for direct grade entry
-- Created: 2025-12-22
-- Allows grades to link directly to grade_categories (no assignments required)

DO $$
BEGIN
  -- Add category_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.grades 
    ADD COLUMN category_id uuid REFERENCES public.grade_categories(id);
    
    RAISE NOTICE 'Added column: category_id';
  END IF;

  -- Make assignment_id nullable (since we don't require assignments anymore)
  ALTER TABLE public.grades 
  ALTER COLUMN assignment_id DROP NOT NULL;
END $$;
