-- ============================================
-- CRITICAL FIX: Add UNIQUE constraint on profiles.user_id
-- ============================================
-- This migration fixes the user creation issue by adding
-- a UNIQUE constraint that enables proper upsert operations.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to: SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================

-- Add unique constraint on user_id
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    -- Add the constraint
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    
    RAISE NOTICE '✅ Added UNIQUE constraint on profiles.user_id';
  ELSE
    RAISE NOTICE '✅ UNIQUE constraint on profiles.user_id already exists';
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'profiles_user_id_key';

-- Success message
SELECT '✅ Migration complete! User creation should now work.' AS status;
