-- Remove exact duplicate indexes accumulated across historical migrations.
-- The retained indexes or UNIQUE constraints cover the same leading columns.
DROP INDEX IF EXISTS public.idx_grades_student_id;
DROP INDEX IF EXISTS public.idx_grades_class_id;
DROP INDEX IF EXISTS public.idx_grades_subject_id;

DROP INDEX IF EXISTS public.idx_attendance_student_id;
DROP INDEX IF EXISTS public.idx_attendance_class_id;

DROP INDEX IF EXISTS public.idx_student_profiles_profile_id;
DROP INDEX IF EXISTS public.idx_settings_key;
DROP INDEX IF EXISTS public.idx_invitations_token;
