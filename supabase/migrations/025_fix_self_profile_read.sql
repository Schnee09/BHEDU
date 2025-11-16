-- Migration: Additional RLS policy for self-profile reads
-- Date: 2025-11-16
-- Issue: Users getting 500 when querying their own profile with specific fields

-- Ensure users can always read their own full profile
DROP POLICY IF EXISTS "Users read own full profile" ON profiles;
CREATE POLICY "Users read own full profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Note: This policy takes precedence and is less restrictive than "Read own profile"
-- Multiple SELECT policies are OR'd together, so this ensures self-reads always work
