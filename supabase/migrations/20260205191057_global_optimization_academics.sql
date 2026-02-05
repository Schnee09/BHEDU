-- Migration: Global Schema Optimization Phase 2 - Academic & Profile Polish (Fixed v15)
-- Created: 2026-02-05
-- Purpose: Standardize academic entities, enforce ENUMs, and harden relational constraints. 
--          Uses COLUMN REPLACEMENT strategy. Fixes VIEW columns duplication (student_code, grade_level).

-- ============================================
-- PHASE 0: DROP ALL DEPENDENT OBJECTS
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS student_performance_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS class_statistics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS teacher_workload CASCADE;
DROP FUNCTION IF EXISTS refresh_performance_views() CASCADE;
DROP POLICY IF EXISTS "Students view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;

-- Drop dependent views for teacher_type
DROP VIEW IF EXISTS public.tutors CASCADE;
DROP VIEW IF EXISTS public.all_teachers CASCADE;

-- ============================================
-- PHASE 1A: ADD half_day TO attendance_status
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'half_day' AND enumtypid = 'attendance_status'::regtype) THEN
    ALTER TYPE attendance_status ADD VALUE 'half_day';
  END IF;
END $$;

-- ============================================
-- PHASE 1B: ENROLLMENT STATUS - COLUMN REPLACEMENT
-- ============================================

-- B1: Drop constraints on status column
ALTER TABLE public.enrollments ALTER COLUMN status DROP DEFAULT;

DO $$ 
DECLARE
  constraint_name_var text;
BEGIN
  FOR constraint_name_var IN 
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.enrollments'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.enrollments DROP CONSTRAINT %I', constraint_name_var);
  END LOOP;
END $$;

-- B2: Create new enum type
DROP TYPE IF EXISTS public.enrollment_status_v2 CASCADE;
CREATE TYPE enrollment_status_v2 AS ENUM ('enrolled', 'completed', 'dropped', 'withdrawn');

-- B3: Add new column
ALTER TABLE public.enrollments ADD COLUMN status_new enrollment_status_v2;

-- B4: Copy data
UPDATE public.enrollments SET status_new = 
  CASE 
    WHEN status::text = 'active' THEN 'enrolled'::enrollment_status_v2
    WHEN status::text = 'enrolled' THEN 'enrolled'::enrollment_status_v2
    WHEN status::text = 'inactive' THEN 'dropped'::enrollment_status_v2
    WHEN status::text = 'completed' THEN 'completed'::enrollment_status_v2
    WHEN status::text = 'dropped' THEN 'dropped'::enrollment_status_v2
    WHEN status::text = 'withdrawn' THEN 'withdrawn'::enrollment_status_v2
    ELSE 'enrolled'::enrollment_status_v2
  END;

-- B5: Swap columns
ALTER TABLE public.enrollments DROP COLUMN status;
ALTER TABLE public.enrollments RENAME COLUMN status_new TO status;
ALTER TABLE public.enrollments ALTER COLUMN status SET DEFAULT 'enrolled'::enrollment_status_v2;

-- B6: Fix enum name
DROP TYPE IF EXISTS public.enrollment_status CASCADE;
ALTER TYPE enrollment_status_v2 RENAME TO enrollment_status;

-- ============================================
-- PHASE 1C: TEACHER TYPE - COLUMN REPLACEMENT
-- ============================================

-- C1: Drop constraints
ALTER TABLE public.teacher_profiles ALTER COLUMN teacher_type DROP DEFAULT;

DO $$ 
DECLARE
  constraint_name_var text;
BEGIN
  FOR constraint_name_var IN 
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.teacher_profiles'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%teacher_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.teacher_profiles DROP CONSTRAINT %I', constraint_name_var);
  END LOOP;
END $$;

-- C2: Create new enum
DROP TYPE IF EXISTS public.teacher_type_v2 CASCADE;
CREATE TYPE teacher_type_v2 AS ENUM ('full_time', 'part_time', 'tutor');

-- C3: Add new column
ALTER TABLE public.teacher_profiles ADD COLUMN teacher_type_new teacher_type_v2;

-- C4: Copy data
UPDATE public.teacher_profiles SET teacher_type_new = 
  CASE 
    WHEN teacher_type::text = 'full_time' THEN 'full_time'::teacher_type_v2
    WHEN teacher_type::text = 'part_time' THEN 'part_time'::teacher_type_v2
    WHEN teacher_type::text = 'tutor' THEN 'tutor'::teacher_type_v2
    ELSE 'full_time'::teacher_type_v2
  END;

-- C5: Swap columns
ALTER TABLE public.teacher_profiles DROP COLUMN teacher_type;
ALTER TABLE public.teacher_profiles RENAME COLUMN teacher_type_new TO teacher_type;
ALTER TABLE public.teacher_profiles ALTER COLUMN teacher_type SET DEFAULT 'full_time'::teacher_type_v2;

-- C6: Fix enum name
DROP TYPE IF EXISTS public.teacher_type CASCADE;
ALTER TYPE teacher_type_v2 RENAME TO teacher_type;

-- ============================================
-- PHASE 2: HARDEN CLASS & ACADEMIC STRUCTURE
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'status') THEN
    ALTER TABLE public.classes ADD COLUMN status public.class_status DEFAULT 'active'::public.class_status;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'timetable_slots_subject_id_fkey') THEN
    ALTER TABLE public.timetable_slots DROP CONSTRAINT timetable_slots_subject_id_fkey;
  END IF;
  ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_subject_id_fkey 
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'courses_subject_id_fkey') THEN
    ALTER TABLE public.courses DROP CONSTRAINT courses_subject_id_fkey;
  END IF;
  ALTER TABLE public.courses ADD CONSTRAINT courses_subject_id_fkey 
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_course_id_fkey') THEN
    ALTER TABLE public.classes DROP CONSTRAINT classes_course_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'course_id') THEN
    ALTER TABLE public.classes ADD CONSTRAINT classes_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================
-- PHASE 3: CONVENIENCE VIEWS
-- ============================================

CREATE OR REPLACE VIEW v_active_profiles AS
SELECT * FROM public.profiles WHERE deleted_at IS NULL AND is_active = true;

CREATE OR REPLACE VIEW v_active_classes AS
SELECT c.*, co.name as course_name, p.full_name as teacher_name
FROM public.classes c
LEFT JOIN public.courses co ON c.course_id = co.id
LEFT JOIN public.profiles p ON c.teacher_id = p.id
WHERE c.deleted_at IS NULL AND c.status = 'active';

-- Fixed View: Aliased both student_code and grade_level to avoid ambiguity with profiles table columns
CREATE OR REPLACE VIEW v_active_students AS
SELECT p.*, sp.student_code AS sp_student_code, sp.grade_level AS sp_grade_level
FROM public.profiles p
JOIN public.student_profiles sp ON p.id = sp.profile_id
WHERE p.role = 'student' AND p.deleted_at IS NULL AND p.is_active = true;

-- ============================================
-- PHASE 4: RECREATE DEPENDENT OBJECTS
-- ============================================

-- Recreate Tutors View
CREATE OR REPLACE VIEW tutors AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.phone,
  p.photo_url,
  tp.teacher_type,
  tp.specialization,
  tp.teaching_subjects,
  tp.hourly_rate,
  tp.bio
FROM profiles p
JOIN teacher_profiles tp ON p.id = tp.profile_id
WHERE tp.teacher_type = 'tutor';

-- Recreate All Teachers View
CREATE OR REPLACE VIEW all_teachers AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.phone,
  p.photo_url,
  p.department,
  tp.teacher_type,
  tp.specialization,
  tp.teaching_subjects,
  tp.hourly_rate,
  tp.bio,
  CASE 
    WHEN tp.teacher_type = 'tutor' THEN 'Gia sư'
    WHEN tp.teacher_type = 'part_time' THEN 'Thỉnh giảng'
    ELSE 'Giáo viên'
  END AS display_type
FROM profiles p
LEFT JOIN teacher_profiles tp ON p.id = tp.profile_id
WHERE p.role = 'teacher';

-- Recreate Policy
CREATE POLICY "Students view enrolled classes"
  ON public.classes FOR SELECT TO authenticated
  USING (
    public.get_current_user_role() = 'student'
    AND id IN (
      SELECT class_id FROM public.enrollments 
      WHERE student_id = public.get_current_profile_id()
      AND status = 'enrolled'
    )
  );

-- Recreate MV: Student Performance
CREATE MATERIALIZED VIEW student_performance_summary AS
SELECT p.id AS student_id, p.full_name, p.student_code, e.class_id, c.name AS class_name,
    COUNT(DISTINCT g.subject_id) AS subjects_count, ROUND(AVG(g.score)::numeric, 2) AS average_score
FROM profiles p JOIN enrollments e ON p.id = e.student_id JOIN classes c ON e.class_id = c.id
LEFT JOIN grades g ON p.id = g.student_id
WHERE p.role = 'student' AND e.status = 'enrolled'
GROUP BY p.id, p.full_name, p.student_code, e.class_id, c.name;

CREATE UNIQUE INDEX idx_mv_student_perf_unique ON student_performance_summary(student_id, class_id);
CREATE INDEX idx_mv_student_perf_class_id ON student_performance_summary(class_id);

-- Recreate MV: Class Statistics
CREATE MATERIALIZED VIEW class_statistics AS
SELECT c.id AS class_id, c.name AS class_name,
    COUNT(DISTINCT e.student_id) AS total_students,
    COUNT(DISTINCT a.id) AS total_attendance_records,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS present_count,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::numeric / 
        NULLIF(COUNT(DISTINCT a.id), 0)::numeric) * 100, 2) AS attendance_rate
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'enrolled'
LEFT JOIN attendance a ON c.id = a.class_id
GROUP BY c.id, c.name;

CREATE UNIQUE INDEX idx_mv_class_stats_unique ON class_statistics(class_id);

-- Recreate MV: Teacher Workload
CREATE MATERIALIZED VIEW teacher_workload AS
SELECT p.id AS teacher_id, p.full_name,
    COUNT(DISTINCT c.id) AS classes_assigned,
    COUNT(DISTINCT ts.id) AS total_slots,
    COALESCE(SUM(EXTRACT(EPOCH FROM (ts.end_time::time - ts.start_time::time))/3600), 0) AS total_hours_per_week
FROM profiles p
LEFT JOIN classes c ON p.id = c.teacher_id
LEFT JOIN timetable_slots ts ON p.id = ts.teacher_id
WHERE p.role IN ('teacher', 'staff', 'admin', 'owner', 'super_admin') 
GROUP BY p.id, p.full_name;

CREATE UNIQUE INDEX idx_mv_teacher_workload_unique ON teacher_workload(teacher_id);

CREATE OR REPLACE FUNCTION refresh_performance_views() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY student_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY class_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY teacher_workload;
EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW student_performance_summary;
    REFRESH MATERIALIZED VIEW class_statistics;
    REFRESH MATERIALIZED VIEW teacher_workload;
END;
$$ LANGUAGE plpgsql;

SELECT 'Global Optimization Phase 2: Complete!' AS status;
