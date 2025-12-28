-- Migration: Schema Overhaul for Vietnamese Grade Management
-- Created: 2025-12-23
-- Purpose: Simplify grades table to link directly to subjects and classes

-- ============================================
-- PHASE 1: ADD NEW COLUMNS
-- ============================================

-- Add subject_id column to grades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'subject_id'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN subject_id uuid REFERENCES public.subjects(id);
    RAISE NOTICE 'Added column: subject_id';
  END IF;
END $$;

-- Add class_id column to grades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE public.grades ADD COLUMN class_id uuid REFERENCES public.classes(id);
    RAISE NOTICE 'Added column: class_id';
  END IF;
END $$;

-- ============================================
-- PHASE 2: BACKFILL FROM GRADE_CATEGORIES
-- ============================================

-- Link grades to subjects via grade_categories
UPDATE grades g
SET subject_id = s.id
FROM grade_categories gc, subjects s
WHERE g.category_id = gc.id
  AND gc.code = s.code
  AND g.subject_id IS NULL;

-- Link grades to classes via grade_categories
UPDATE grades g
SET class_id = gc.class_id
FROM grade_categories gc
WHERE g.category_id = gc.id
  AND g.class_id IS NULL;

-- For grades linked to assignments, get class_id from assignment
UPDATE grades g
SET class_id = a.class_id
FROM assignments a
WHERE g.assignment_id = a.id
  AND g.class_id IS NULL;

-- ============================================
-- PHASE 3: NORMALIZE SCORES TO 10-POINT SCALE
-- ============================================

-- Convert percentage scores (>10) to 10-point scale
UPDATE grades
SET score = score / 10.0
WHERE score > 10;

-- Ensure points_earned matches score
UPDATE grades
SET points_earned = score
WHERE points_earned IS NULL OR points_earned != score;

-- ============================================
-- PHASE 4: SET DEFAULT COMPONENT_TYPE AND SEMESTER
-- ============================================

-- Set default component_type for grades without one
UPDATE grades
SET component_type = 'one_period'
WHERE component_type IS NULL;

-- Set default semester for grades without one
UPDATE grades
SET semester = '1'
WHERE semester IS NULL;

-- ============================================
-- PHASE 5: DROP LEGACY COLUMNS AND TABLES
-- ============================================

-- Drop assignment_id column from grades
ALTER TABLE grades DROP COLUMN IF EXISTS assignment_id CASCADE;

-- Drop category_id column from grades
ALTER TABLE grades DROP COLUMN IF EXISTS category_id CASCADE;

-- Drop legacy tables
DROP TABLE IF EXISTS grades_backup CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_categories CASCADE;
DROP TABLE IF EXISTS grade_categories CASCADE;

-- ============================================
-- PHASE 6: ADD CONSTRAINTS
-- ============================================

-- Make subject_id and class_id NOT NULL (after backfill)
-- Only do this if all grades have these values
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM grades WHERE subject_id IS NULL OR class_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE grades ALTER COLUMN subject_id SET NOT NULL;
    ALTER TABLE grades ALTER COLUMN class_id SET NOT NULL;
    RAISE NOTICE 'Set subject_id and class_id to NOT NULL';
  ELSE
    RAISE NOTICE 'Skipping NOT NULL constraint: % grades still have NULL subject_id or class_id', null_count;
  END IF;
END $$;

-- Add unique constraint for grade entry
-- (one score per student + class + subject + component + semester)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grades_unique_entry'
  ) THEN
    ALTER TABLE grades ADD CONSTRAINT grades_unique_entry 
    UNIQUE (student_id, class_id, subject_id, component_type, semester);
    RAISE NOTICE 'Added unique constraint: grades_unique_entry';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add unique constraint (duplicates may exist)';
END $$;

-- ============================================
-- DONE
-- ============================================
SELECT 'Migration complete!' AS status;
