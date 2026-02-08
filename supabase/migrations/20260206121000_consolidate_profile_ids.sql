-- Migration: Profile Identity Consolidation (The "Identity Merge")
-- Created: 2026-02-06
-- Purpose: Unify profiles.id with auth.users.id where they diverged in legacy accounts.

-- 1. Helper Function: Safely update column ONLY if it exists
CREATE OR REPLACE FUNCTION public.safe_update_column(p_table TEXT, p_column TEXT, p_new_val UUID, p_old_val UUID)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table 
        AND column_name = p_column
    ) THEN
        EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', p_table, p_column, p_column)
        USING p_new_val, p_old_val;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Helper Function: Drop FK constraints on a column that reference public.profiles
CREATE OR REPLACE FUNCTION public.safe_drop_fk_to_profiles(p_table TEXT, p_column TEXT)
RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    -- Find FK constraints on (p_table, p_column) that reference profiles(id)
    FOR r IN (
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
        JOIN pg_class ref_t ON c.confrelid = ref_t.oid
        WHERE n.nspname = 'public'
        AND t.relname = p_table
        AND a.attname = p_column
        AND c.contype = 'f'  -- Foreign Key only
        AND ref_t.relname = 'profiles'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', p_table, r.conname);
        RAISE NOTICE 'Dropped FK constraint % on %.%', r.conname, p_table, p_column;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Helper Function: Safely add constraint ONLY if table and column exist
CREATE OR REPLACE FUNCTION public.safe_add_constraint(p_table TEXT, p_column TEXT, p_constraint TEXT, p_ref_table TEXT, p_ref_col TEXT, p_on_delete TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table 
        AND column_name = p_column
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = p_table 
        AND constraint_name = p_constraint
    ) THEN
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON UPDATE CASCADE %s', 
            p_table, p_constraint, p_column, p_ref_table, p_ref_col, p_on_delete
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Execute the Consolidation
BEGIN;

-- PHASE A: Drop all FK constraints that specifically reference profiles(id)
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name IN (
            'profile_id', 'student_id', 'teacher_id', 'user_id', 
            'marked_by', 'graded_by', 'parent_id', 'reviewed_by', 
            'generated_by', 'received_by', 'imported_by', 'invited_by', 'used_by',
            'created_by', 'updated_by'
        )
    ) LOOP
        -- Skip the profiles table itself
        IF t.table_name = 'profiles' THEN 
            CONTINUE; 
        END IF;
        
        PERFORM public.safe_drop_fk_to_profiles(t.table_name, t.column_name);
    END LOOP;
END $$;

-- Update mismatched IDs
DO $$
DECLARE
    r RECORD;
    t_name RECORD;
BEGIN
    FOR r IN (
        SELECT id as old_id, user_id as new_id 
        FROM public.profiles 
        WHERE user_id IS NOT NULL AND id != user_id
    ) LOOP
        -- Migrate all dependents via helper
        PERFORM public.safe_update_column('classes', 'teacher_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('attendance', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('attendance', 'marked_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('attendance_reports', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('attendance_reports', 'generated_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('courses', 'teacher_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('enrollments', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('guardians', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('student_accounts', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('invoices', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('payments', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('payments', 'received_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('import_logs', 'imported_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('notifications', 'user_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('grades', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('grades', 'graded_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('student_profiles', 'profile_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('teacher_profiles', 'profile_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('user_invitations', 'invited_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('user_invitations', 'used_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('parent_student_links', 'parent_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('parent_student_links', 'student_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('parent_student_links', 'reviewed_by', r.new_id, r.old_id);
        PERFORM public.safe_update_column('teacher_subjects', 'profile_id', r.new_id, r.old_id);
        PERFORM public.safe_update_column('teacher_workload', 'teacher_id', r.new_id, r.old_id);

        -- Also catch any generic created_by/updated_by columns in ALL tables
        FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            PERFORM public.safe_update_column(t_name.tablename, 'created_by', r.new_id, r.old_id);
            PERFORM public.safe_update_column(t_name.tablename, 'updated_by', r.new_id, r.old_id);
        END LOOP;
        
        -- Finally update the profile ID itself
        UPDATE public.profiles SET id = r.new_id WHERE id = r.old_id;
        
        RAISE NOTICE 'Merged Profile ID % into User ID %', r.old_id, r.new_id;
    END LOOP;
END $$;

-- Restore constraints with ON UPDATE CASCADE
SELECT public.safe_add_constraint('classes', 'teacher_id', 'classes_teacher_id_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('attendance', 'student_id', 'attendance_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('attendance', 'marked_by', 'attendance_marked_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('attendance_reports', 'student_id', 'attendance_reports_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('attendance_reports', 'generated_by', 'attendance_reports_generated_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('courses', 'teacher_id', 'courses_teacher_id_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('enrollments', 'student_id', 'enrollments_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('guardians', 'student_id', 'guardians_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('student_accounts', 'student_id', 'student_accounts_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('invoices', 'student_id', 'invoices_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('payments', 'student_id', 'payments_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('payments', 'received_by', 'payments_received_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('import_logs', 'imported_by', 'import_logs_imported_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('notifications', 'user_id', 'notifications_user_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('grades', 'student_id', 'grades_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('grades', 'graded_by', 'grades_graded_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('student_profiles', 'profile_id', 'student_profiles_profile_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('teacher_profiles', 'profile_id', 'teacher_profiles_profile_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('user_invitations', 'invited_by', 'user_invitations_invited_by_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('user_invitations', 'used_by', 'user_invitations_used_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('parent_student_links', 'parent_id', 'parent_student_links_parent_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('parent_student_links', 'student_id', 'parent_student_links_student_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('parent_student_links', 'reviewed_by', 'parent_student_links_reviewed_by_fkey', 'profiles', 'id', 'ON DELETE SET NULL');
SELECT public.safe_add_constraint('teacher_subjects', 'profile_id', 'teacher_subjects_profile_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');
SELECT public.safe_add_constraint('teacher_workload', 'teacher_id', 'teacher_workload_teacher_id_fkey', 'profiles', 'id', 'ON DELETE CASCADE');

COMMIT;

-- cleanup helpers
DROP FUNCTION IF EXISTS public.safe_update_column(TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.safe_drop_constraint(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.safe_add_constraint(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

SELECT 'Profile IDs consolidated and constraints updated with ON UPDATE CASCADE' as result;
