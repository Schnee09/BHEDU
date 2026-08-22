-- Migration: Sync duplicated columns between profiles and student_profiles/teacher_profiles (P1)
-- Prevent recursive trigger loops using IS DISTINCT FROM checks

-- Relax the check constraint on profiles to allow 3-5 digit suffixes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS student_code_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT student_code_format_check
CHECK (
  role != 'student' 
  OR student_code IS NULL 
  OR student_code ~ '^HS\d{4}\d{3,5}$'           -- Accepts 3 to 5 digit suffixes (e.g. HS202500001, HS20260001, HS2026001)
  OR student_code ~ '^STU-\d{4}-\d{4}$'
);

-- ============================================
-- 1. Sync profiles -> student_profiles (AFTER INSERT OR UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_to_student_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (
      profile_id, student_code, grade_level, enrollment_date, notes
    ) VALUES (
      NEW.id, NEW.student_code, NEW.grade_level, NEW.enrollment_date, NEW.notes
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      student_code = EXCLUDED.student_code,
      grade_level = EXCLUDED.grade_level,
      enrollment_date = EXCLUDED.enrollment_date,
      notes = EXCLUDED.notes
    WHERE 
      student_profiles.student_code IS DISTINCT FROM EXCLUDED.student_code OR
      student_profiles.grade_level IS DISTINCT FROM EXCLUDED.grade_level OR
      student_profiles.enrollment_date IS DISTINCT FROM EXCLUDED.enrollment_date OR
      student_profiles.notes IS DISTINCT FROM EXCLUDED.notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profile_to_student_profile ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_student_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_student_profile();

-- ============================================
-- 2. Sync student_profiles -> profiles (AFTER UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_student_profile_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET
    student_code = NEW.student_code,
    grade_level = NEW.grade_level,
    enrollment_date = NEW.enrollment_date,
    notes = NEW.notes
  WHERE id = NEW.profile_id AND (
    profiles.student_code IS DISTINCT FROM NEW.student_code OR
    profiles.grade_level IS DISTINCT FROM NEW.grade_level OR
    profiles.enrollment_date IS DISTINCT FROM NEW.enrollment_date OR
    profiles.notes IS DISTINCT FROM NEW.notes
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_student_profile_to_profile ON public.student_profiles;
CREATE TRIGGER trigger_sync_student_profile_to_profile
  AFTER INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile_to_profile();

-- ============================================
-- 3. Sync profiles -> teacher_profiles (AFTER INSERT OR UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_to_teacher_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teacher_profiles (
      profile_id, department
    ) VALUES (
      NEW.id, NEW.department
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      department = EXCLUDED.department
    WHERE 
      teacher_profiles.department IS DISTINCT FROM EXCLUDED.department;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profile_to_teacher_profile ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_teacher_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_teacher_profile();

-- ============================================
-- 4. Sync teacher_profiles -> profiles (AFTER UPDATE)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_teacher_profile_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET
    department = NEW.department
  WHERE id = NEW.profile_id AND (
    profiles.department IS DISTINCT FROM NEW.department
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_teacher_profile_to_profile ON public.teacher_profiles;
CREATE TRIGGER trigger_sync_teacher_profile_to_profile
  AFTER INSERT OR UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_teacher_profile_to_profile();

-- ============================================
-- 5. INITIAL DATA SYNCHRONIZATION
-- ============================================
-- Sync profiles -> student_profiles
INSERT INTO public.student_profiles (profile_id, student_code, grade_level, enrollment_date, notes)
SELECT id, student_code, grade_level, enrollment_date, notes 
FROM public.profiles 
WHERE role = 'student'
ON CONFLICT (profile_id) DO UPDATE SET
  student_code = COALESCE(EXCLUDED.student_code, student_profiles.student_code),
  grade_level = COALESCE(EXCLUDED.grade_level, student_profiles.grade_level),
  enrollment_date = COALESCE(EXCLUDED.enrollment_date, student_profiles.enrollment_date),
  notes = COALESCE(EXCLUDED.notes, student_profiles.notes);

-- Sync student_profiles -> profiles
UPDATE public.profiles p
SET
  student_code = COALESCE(sp.student_code, p.student_code),
  grade_level = COALESCE(sp.grade_level, p.grade_level),
  enrollment_date = COALESCE(sp.enrollment_date, p.enrollment_date),
  notes = COALESCE(sp.notes, p.notes)
FROM public.student_profiles sp
WHERE p.id = sp.profile_id;

-- Sync profiles -> teacher_profiles
INSERT INTO public.teacher_profiles (profile_id, department)
SELECT id, department 
FROM public.profiles 
WHERE role = 'teacher'
ON CONFLICT (profile_id) DO UPDATE SET
  department = COALESCE(EXCLUDED.department, teacher_profiles.department);

-- Sync teacher_profiles -> profiles
UPDATE public.profiles p
SET
  department = COALESCE(tp.department, p.department)
FROM public.teacher_profiles tp
WHERE p.id = tp.profile_id;
