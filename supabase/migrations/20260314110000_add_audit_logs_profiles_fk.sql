-- Migration: Add Audit Logs Profiles ForeignKey
-- Description: Link audit_logs(user_id) to profiles(id) to enable PostgREST joins
-- Date: 2026-03-14

DO $$
BEGIN
    -- Drop the existing constraint if it points to auth.users or just exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
    END IF;

    -- Add the new constraint referencing profiles(id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_profiles_fkey') THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT audit_logs_user_id_profiles_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;
