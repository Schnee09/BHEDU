-- Migration: Ensure Grades Unique Constraint
-- Created: 2026-02-08
-- Purpose: Clean up duplicates and (re)create the unique constraint for grades.

BEGIN;

-- 1. Identify and delete duplicates
-- We keep the record with the latest graded_at or the largest id
DELETE FROM public.grades g1
USING public.grades g2
WHERE 
    g1.id < g2.id AND -- Keep the one with higher ID
    g1.student_id = g2.student_id AND
    g1.class_id = g2.class_id AND
    g1.subject_id = g2.subject_id AND
    g1.component_type = g2.component_type AND
    g1.semester = g2.semester;

-- 2. Drop existing constraint if it exists (by name)
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_unique_entry;

-- 3. Add the unique constraint explicitly
-- Note: It is better to have these NOT NULL if they are part of a unique key,
-- but for now we follow the existing schema and just add the constraint.
ALTER TABLE public.grades ADD CONSTRAINT grades_unique_entry UNIQUE (student_id, class_id, subject_id, component_type, semester);

COMMIT;
