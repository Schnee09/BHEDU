-- Migration: Optimize Class Queries & Schema Sync
-- Description: Add missing columns to classes table (sync with codebase) and add performance indices.

-- 1. Add missing columns to classes table if they don't exist
DO $$ 
BEGIN
  -- course_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'course_id') THEN
    ALTER TABLE public.classes ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;
  END IF;

  -- academic_year_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'academic_year_id') THEN
    ALTER TABLE public.classes ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'status') THEN
    ALTER TABLE public.classes ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'));
  END IF;

  -- room
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'room') THEN
    ALTER TABLE public.classes ADD COLUMN room TEXT;
  END IF;

  -- schedule
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'schedule') THEN
    ALTER TABLE public.classes ADD COLUMN schedule TEXT;
  END IF;

  -- capacity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'capacity') THEN
    ALTER TABLE public.classes ADD COLUMN capacity INTEGER;
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'updated_at') THEN
    ALTER TABLE public.classes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Create Indices for Performance
-- Index for classes(teacher_id) to speed up filtering by teacher and joins
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes (teacher_id);

-- Index for classes(course_id) to speed up joins with courses
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes (course_id);

-- Index for classes(academic_year_id) for filtering
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON public.classes (academic_year_id);

-- Composite index for enrollments to speed up count queries (class_id + status)
CREATE INDEX IF NOT EXISTS idx_enrollments_class_status ON public.enrollments (class_id, status);

-- Index for classes(status) if frequently filtered
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes (status);
