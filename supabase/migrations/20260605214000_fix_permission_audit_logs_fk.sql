-- Migration: Fix Permission Audit Logs Foreign Keys to Profiles
-- Created: 2026-06-05
-- Purpose: Point foreign keys for user_id and performed_by in permission_audit_logs to public.profiles(id) instead of auth.users(id) so that PostgREST can resolve the joins.

DO $$
BEGIN
    -- Drop existing user constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_audit_logs_user_fkey') THEN
        ALTER TABLE public.permission_audit_logs DROP CONSTRAINT permission_audit_logs_user_fkey;
    END IF;

    -- Add the constraint referencing public.profiles(id)
    ALTER TABLE public.permission_audit_logs
    ADD CONSTRAINT permission_audit_logs_user_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

    -- Drop existing performer constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_audit_logs_performer_fkey') THEN
        ALTER TABLE public.permission_audit_logs DROP CONSTRAINT permission_audit_logs_performer_fkey;
    END IF;

    -- Add the constraint referencing public.profiles(id)
    ALTER TABLE public.permission_audit_logs
    ADD CONSTRAINT permission_audit_logs_performer_fkey 
    FOREIGN KEY (performed_by) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
