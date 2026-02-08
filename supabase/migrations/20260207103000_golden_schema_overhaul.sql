-- ==========================================================
-- GOLDEN SCHEMA OVERHAUL & OPTIMIZATION
-- Created: 2026-02-07
-- Objective: Fix all missing FKs, remove redundancies, add indexes
-- ==========================================================

BEGIN;

-- 1. PREPARE COLUMNS
ALTER TABLE public.timetable_slots ADD COLUMN IF NOT EXISTS semester_id uuid;

-- 2. CLEANUP ORPHANED RECORDS (Handle data that would break constraints)
-- Example: Remove timetable slots with non-existent teachers/students
DELETE FROM public.timetable_slots WHERE teacher_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.timetable_slots WHERE student_id IS NOT NULL AND student_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.timetable_slots WHERE class_id NOT IN (SELECT id FROM public.classes);
DELETE FROM public.timetable_slots WHERE semester_id IS NOT NULL AND semester_id NOT IN (SELECT id FROM public.semesters);

-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS

-- Timetable
ALTER TABLE public.timetable_slots 
  DROP CONSTRAINT IF EXISTS timetable_slots_class_id_fkey,
  DROP CONSTRAINT IF EXISTS timetable_slots_subject_id_fkey,
  DROP CONSTRAINT IF EXISTS timetable_slots_teacher_id_fkey,
  DROP CONSTRAINT IF EXISTS timetable_slots_student_id_fkey,
  DROP CONSTRAINT IF EXISTS timetable_slots_semester_id_fkey;

ALTER TABLE public.timetable_slots 
  ADD CONSTRAINT timetable_slots_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  ADD CONSTRAINT timetable_slots_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
  ADD CONSTRAINT timetable_slots_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT timetable_slots_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT timetable_slots_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;

-- Grades
ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_student_id_fkey,
  DROP CONSTRAINT IF EXISTS grades_class_id_fkey,
  DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;

ALTER TABLE public.grades
  ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Finance
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE public.invoice_items
  ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Student Management
ALTER TABLE public.student_conducts
  DROP CONSTRAINT IF EXISTS student_conducts_student_id_fkey;
ALTER TABLE public.student_conducts
  ADD CONSTRAINT student_conducts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_notes
  DROP CONSTRAINT IF EXISTS student_notes_student_id_fkey;
ALTER TABLE public.student_notes
  ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. REMOVE REDUNDANT COLUMNS FROM PROFILES (Moving to role-specific tables)
-- First, ensure student_profiles has the columns
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS student_code text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS grade_level text;

-- Sync data from profiles to student_profiles
UPDATE public.student_profiles sp
SET student_code = p.student_code, grade_level = p.grade_level
FROM public.profiles p
WHERE sp.profile_id = p.id AND (sp.student_code IS NULL OR sp.grade_level IS NULL);

-- 5. ADD PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher ON public.timetable_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_student ON public.timetable_slots(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class ON public.timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_class ON public.grades(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);

COMMIT;
