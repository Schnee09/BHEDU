-- Migration 039: Add first_name and last_name to profiles
-- Date: 2025-11-20
-- Purpose: Fix schema mismatch - API routes expect first_name/last_name but table only has full_name

-- Add first_name and last_name columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Split existing full_name into first_name and last_name
-- This handles cases where full_name already exists
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE 
    WHEN full_name LIKE '% %' THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE ''
  END
WHERE full_name IS NOT NULL 
  AND (first_name IS NULL OR last_name IS NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add comments
COMMENT ON COLUMN profiles.first_name IS 'User first name (split from full_name for API compatibility)';
COMMENT ON COLUMN profiles.last_name IS 'User last name (split from full_name for API compatibility)';
COMMENT ON COLUMN profiles.email IS 'User email address';

-- Create or replace function to sync full_name when first_name/last_name changes
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Update full_name when first_name or last_name changes
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
      NEW.full_name = TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep full_name in sync
DROP TRIGGER IF EXISTS sync_full_name_trigger ON profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

COMMENT ON FUNCTION sync_full_name IS 'Automatically syncs full_name column when first_name or last_name changes';
