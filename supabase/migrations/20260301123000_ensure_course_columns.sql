-- Migration: Ensure Courses Table Columns
-- Created: 2026-03-01
-- Purpose: Add missing columns to courses table for consistency across environments

DO $$ 
BEGIN
  -- 1. Ensure columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'grade_level') THEN
    ALTER TABLE courses ADD COLUMN grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'name_vi') THEN
    ALTER TABLE courses ADD COLUMN name_vi TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'semester') THEN
    ALTER TABLE courses ADD COLUMN semester INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'academic_year_id') THEN
    ALTER TABLE courses ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'hours_per_week') THEN
    ALTER TABLE courses ADD COLUMN hours_per_week INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_required') THEN
    ALTER TABLE courses ADD COLUMN is_required BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_active') THEN
    ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  -- 2. Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_courses_grade_level ON courses(grade_level);
  CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
  CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);

END $$;
