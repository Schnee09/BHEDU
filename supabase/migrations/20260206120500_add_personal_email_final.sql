-- Migration: Add missing personal_email to profiles
-- Created: 2026-02-06
-- Purpose: Fix 400 errors during profile fetch

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'personal_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN personal_email TEXT;
  END IF;
END $$;

-- Verify it works by selecting it
SELECT personal_email FROM public.profiles LIMIT 1;
