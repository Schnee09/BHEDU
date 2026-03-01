-- Migration: Remove sync_full_name Trigger
-- Created: 2026-02-24
-- Purpose: Remove the database trigger that forces Western name formatting, allowing the frontend to save Vietnamese names correctly.

DO $$
BEGIN
  -- 1. Drop the trigger from the profiles table
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_full_name_trigger'
  ) THEN
    DROP TRIGGER sync_full_name_trigger ON public.profiles;
    RAISE NOTICE 'Dropped trigger sync_full_name_trigger';
  END IF;

  -- 2. Drop the associated function
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'sync_full_name'
  ) THEN
    DROP FUNCTION public.sync_full_name();
    RAISE NOTICE 'Dropped function sync_full_name()';
  END IF;
END $$;

SELECT 'Successfully removed sync_full_name trigger and function!' AS status;
