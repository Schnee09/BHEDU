-- Migration: Robust Profile RLS with user_id Backfill
-- Created: 2026-02-06
-- Purpose: Support legacy accounts where user_id might be NULL but ID matches Auth UID

-- 1. Create a function to ensure user_id is backfilled if missing during update
CREATE OR REPLACE FUNCTION public.ensure_profile_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is null and the record matches auth.uid() (either by ID or user_id)
    -- ensure we set the correct user_id
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing triggers and policies to avoid conflicts
DROP TRIGGER IF EXISTS tr_ensure_profile_user_id ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile v2" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 3. Re-create the trigger for backfilling
CREATE TRIGGER tr_ensure_profile_user_id
    BEFORE UPDATE OR INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_user_id();

-- 4. Create a more robust UPDATE policy
-- Allows update if user_id matches OR if the profile id itself is the auth uid (legacy)
CREATE POLICY "Users can update their own profile v2Plus"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR id = auth.uid());

-- 5. Robust INSERT policy
CREATE POLICY "Users can insert their own profile v2Plus"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR id = auth.uid());

-- 6. Direct Backfill for any logged-in user who hasn't been fixed yet
-- This runs during migration for any record where ID = user_id (common pattern)
-- but user_id column itself is null or mismatches
UPDATE public.profiles
SET user_id = id
WHERE user_id IS NULL AND id IS NOT NULL AND id IN (SELECT id FROM auth.users);

SELECT 'Robust profile storage and RLS enabled' as status;
