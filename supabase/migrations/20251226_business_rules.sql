-- Migration: Business Rules for Vietnamese Education System
-- Created: 2025-12-26
-- Purpose: Add class capacity limits, tuition configuration, and grade structure

-- ============================================
-- PHASE 1: UPDATE CLASSES TABLE
-- ============================================

-- Add max_capacity column (default 12 students)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN max_capacity INTEGER DEFAULT 12;
    RAISE NOTICE 'Added column: max_capacity';
  END IF;
END $$;

-- Add sessions_per_week column (2 or 3 sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'sessions_per_week'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN sessions_per_week INTEGER DEFAULT 2;
    RAISE NOTICE 'Added column: sessions_per_week';
  END IF;
END $$;

-- Add class_type column (group or tutoring)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'class_type'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN class_type VARCHAR(20) DEFAULT 'group';
    RAISE NOTICE 'Added column: class_type';
  END IF;
END $$;

-- Add CHECK constraint for sessions_per_week
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_sessions_per_week_check'
  ) THEN
    ALTER TABLE public.classes ADD CONSTRAINT classes_sessions_per_week_check 
      CHECK (sessions_per_week IN (2, 3));
    RAISE NOTICE 'Added constraint: classes_sessions_per_week_check';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add sessions_per_week constraint';
END $$;

-- Add CHECK constraint for class_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_class_type_check'
  ) THEN
    ALTER TABLE public.classes ADD CONSTRAINT classes_class_type_check 
      CHECK (class_type IN ('group', 'tutoring'));
    RAISE NOTICE 'Added constraint: classes_class_type_check';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add class_type constraint';
END $$;

-- ============================================
-- PHASE 2: CREATE TUITION CONFIG TABLE
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.tuition_config') IS NULL THEN
    CREATE TABLE public.tuition_config (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      class_type VARCHAR(20) NOT NULL,
      sessions_per_week INTEGER NOT NULL,
      monthly_fee DECIMAL(12,0) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT tuition_config_pkey PRIMARY KEY (id),
      CONSTRAINT tuition_config_unique UNIQUE (class_type, sessions_per_week),
      CONSTRAINT tuition_config_class_type_check CHECK (class_type IN ('group', 'tutoring')),
      CONSTRAINT tuition_config_sessions_check CHECK (sessions_per_week IN (2, 3))
    );

    -- Seed default tuition rates
    INSERT INTO public.tuition_config (class_type, sessions_per_week, monthly_fee, description) VALUES
    ('group', 3, 1200000, 'Lớp nhóm - 3 buổi/tuần'),
    ('group', 2, 800000, 'Lớp nhóm - 2 buổi/tuần'),
    ('tutoring', 2, 1200000, 'Kèm gia sư - 2 buổi/tuần'),
    ('tutoring', 3, 1800000, 'Kèm gia sư - 3 buổi/tuần');

    RAISE NOTICE 'Created table: tuition_config with default rates';
  END IF;
END $$;

-- ============================================
-- PHASE 3: UPDATE GRADES COMPONENT TYPES
-- ============================================

-- Update existing grades to use new component types
UPDATE public.grades
SET component_type = CASE 
  WHEN component_type IN ('MIDTERM', 'midterm', 'giua_ky', 'Giữa kỳ') THEN 'midterm'
  WHEN component_type IN ('FINAL', 'final', 'cuoi_ky', 'Cuối kỳ') THEN 'final'
  ELSE 'midterm' -- Default old regular grades to midterm
END
WHERE component_type IS NOT NULL;

-- Set default for null component_type
UPDATE public.grades
SET component_type = 'midterm'
WHERE component_type IS NULL;

-- Add CHECK constraint for component_type (only midterm/final)
DO $$
BEGIN
  -- First drop old constraint if exists
  ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_component_type_check;
  
  -- Add new constraint
  ALTER TABLE public.grades ADD CONSTRAINT grades_component_type_check 
    CHECK (component_type IN ('midterm', 'final'));
  RAISE NOTICE 'Updated constraint: grades_component_type_check (midterm/final only)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update component_type constraint: %', SQLERRM;
END $$;

-- ============================================
-- PHASE 4: CREATE FUNCTION FOR ENROLLMENT CHECK
-- ============================================

-- Function to check if class is at capacity
CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_cap INTEGER;
BEGIN
  -- Get current enrollment count
  SELECT COUNT(*) INTO current_count
  FROM public.enrollments
  WHERE class_id = NEW.class_id AND status = 'active';

  -- Get max capacity
  SELECT COALESCE(max_capacity, 12) INTO max_cap
  FROM public.classes
  WHERE id = NEW.class_id;

  -- Check if at capacity
  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'Class is at maximum capacity (% students)', max_cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrollment capacity check
DROP TRIGGER IF EXISTS check_enrollment_capacity ON public.enrollments;
CREATE TRIGGER check_enrollment_capacity
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_class_capacity();

-- ============================================
-- PHASE 5: CREATE FUNCTION TO CALCULATE AVERAGE GRADE
-- ============================================

-- Function to calculate average grade (50% midterm + 50% final)
CREATE OR REPLACE FUNCTION public.calculate_average_grade(
  p_student_id uuid,
  p_class_id uuid,
  p_subject_id uuid,
  p_semester text DEFAULT '1'
)
RETURNS DECIMAL AS $$
DECLARE
  midterm_score DECIMAL;
  final_score DECIMAL;
  avg_score DECIMAL;
BEGIN
  -- Get midterm score
  SELECT score INTO midterm_score
  FROM public.grades
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND subject_id = p_subject_id
    AND semester = p_semester
    AND component_type = 'midterm'
  LIMIT 1;

  -- Get final score
  SELECT score INTO final_score
  FROM public.grades
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND subject_id = p_subject_id
    AND semester = p_semester
    AND component_type = 'final'
  LIMIT 1;

  -- Calculate 50:50 average
  IF midterm_score IS NOT NULL AND final_score IS NOT NULL THEN
    avg_score := (midterm_score + final_score) / 2.0;
  ELSIF midterm_score IS NOT NULL THEN
    avg_score := midterm_score;
  ELSIF final_score IS NOT NULL THEN
    avg_score := final_score;
  ELSE
    avg_score := NULL;
  END IF;

  RETURN ROUND(avg_score, 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 6: CREATE FUNCTION TO GET TUITION FEE
-- ============================================

-- Function to get monthly tuition for a class
CREATE OR REPLACE FUNCTION public.get_class_tuition(p_class_id uuid)
RETURNS DECIMAL AS $$
DECLARE
  tuition_fee DECIMAL;
BEGIN
  SELECT tc.monthly_fee INTO tuition_fee
  FROM public.classes c
  JOIN public.tuition_config tc 
    ON c.class_type = tc.class_type 
    AND c.sessions_per_week = tc.sessions_per_week
  WHERE c.id = p_class_id 
    AND tc.is_active = true;

  RETURN COALESCE(tuition_fee, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'Migration complete: Business rules applied!' AS status;
