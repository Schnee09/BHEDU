-- Migration: Fix classes table to match application expectations
-- This migration adds all missing columns that the application APIs expect

-- 1. Add missing columns to classes table
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS room_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS schedule TEXT,
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Migrate existing 'grade' data to 'grade_level' if needed
UPDATE public.classes 
SET grade_level = grade 
WHERE grade_level IS NULL AND grade IS NOT NULL;

-- 3. Set default status for existing classes
UPDATE public.classes 
SET status = 'active' 
WHERE status IS NULL;

-- 4. Generate codes for existing classes without codes
UPDATE public.classes
SET code = 'CLS-' || SUBSTRING(id::text, 1, 8)
WHERE code IS NULL;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON public.classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);

-- 6. RLS policies are handled in 20251120_fix_infinite_recursion.sql
-- This migration focuses only on adding columns and indexes

-- 11. Add comment
COMMENT ON COLUMN public.classes.code IS 'Unique class code identifier';
COMMENT ON COLUMN public.classes.grade_level IS 'Grade level (e.g., 10, 11, 12)';
COMMENT ON COLUMN public.classes.status IS 'Class status: active, archived, draft';
COMMENT ON COLUMN public.classes.academic_year_id IS 'Reference to academic year';
