-- Migration: Performance and Cleanup
-- Created: 2026-01-25
-- Purpose: Add missing indexes and expand invitation roles

-- 1. Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- 2. Expand role check in user_invitations
-- First drop the old constraint
ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;

-- Add new constraint with all management roles
ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check 
  CHECK (role IN ('super_admin', 'owner', 'admin', 'staff', 'teacher', 'tutor', 'parent'));

-- 3. Add column for deactivation reason (Account Lifecycle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status_note'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status_note TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.status_note IS 'Reason for suspension or deactivation';
