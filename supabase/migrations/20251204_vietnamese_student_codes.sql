-- Migration: Update Student Codes to Vietnamese Format
-- Description: Convert existing student codes from STU-YYYY-NNNN to HSYYYYNNN format
-- Date: 2025-12-04
-- Author: BH-EDU System

-- ============================================================================
-- STEP 1: Add comment to student_code column
-- ============================================================================

COMMENT ON COLUMN profiles.student_code IS 
'Vietnamese student code format: HS + Year + 3-digit sequential (e.g., HS2025001). 
Legacy format STU-YYYY-NNNN supported for backward compatibility.';

-- ============================================================================
-- STEP 2: Create function to convert old format to new format
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_student_code_to_vietnamese(old_code TEXT, p_student_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  number_part TEXT;
  new_code TEXT;
  code_exists BOOLEAN;
  retry_count INTEGER := 0;
  max_retries INTEGER := 100;
BEGIN
  -- Check if already in new format
  IF old_code ~ '^HS\d{4}\d{3}$' THEN
    RETURN old_code;
  END IF;
  
  -- Check if in old format: STU-YYYY-NNNN
  IF old_code ~ '^STU-\d{4}-\d{4}$' THEN
    -- Extract year and number parts
    year_part := substring(old_code from 5 for 4);
    number_part := substring(old_code from 10 for 4);
    
    -- Convert to new format: HSYYYYNNN (3 digits for number)
    -- If old number is > 999, keep last 3 digits
    IF number_part::INTEGER > 999 THEN
      number_part := substring(number_part from 2 for 3);
    END IF;
    
    -- Handle edge case: if number is 0, start from 001
    IF number_part::INTEGER = 0 THEN
      number_part := '001';
    END IF;
    
    new_code := 'HS' || year_part || lpad(number_part, 3, '0');
    
    -- Check for duplicates and increment if needed
    LOOP
      -- Check if this code already exists (excluding current student)
      SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE student_code = new_code 
        AND (p_student_id IS NULL OR id != p_student_id)
      ) INTO code_exists;
      
      -- If code doesn't exist or is the current student's code, use it
      IF NOT code_exists THEN
        RETURN new_code;
      END IF;
      
      -- Increment and try again
      number_part := lpad((number_part::INTEGER + 1)::TEXT, 3, '0');
      new_code := 'HS' || year_part || number_part;
      
      retry_count := retry_count + 1;
      IF retry_count >= max_retries THEN
        RAISE EXCEPTION 'Could not generate unique student code after % attempts', max_retries;
      END IF;
    END LOOP;
  END IF;
  
  -- If format is unrecognized, return as-is
  RETURN old_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- STEP 3: Preview conversion (DO NOT EXECUTE UPDATE YET)
-- ============================================================================

-- Run this query first to preview the changes:
SELECT 
  id,
  full_name,
  email,
  student_code AS old_code,
  convert_student_code_to_vietnamese(student_code, id) AS new_code,
  CASE 
    WHEN student_code = convert_student_code_to_vietnamese(student_code, id) THEN 'No change'
    ELSE 'Will be updated'
  END AS status
FROM profiles
WHERE role = 'student'
  AND student_code IS NOT NULL
ORDER BY student_code;

-- ============================================================================
-- STEP 4: Update all student codes to Vietnamese format
-- IMPORTANT: Only run this after reviewing the preview above!
-- ============================================================================

-- Execute the update with duplicate handling
DO $$
DECLARE
  student_record RECORD;
  new_code TEXT;
BEGIN
  -- Update each student one by one to handle duplicates
  FOR student_record IN 
    SELECT id, student_code
    FROM profiles
    WHERE role = 'student'
      AND student_code IS NOT NULL
      AND student_code ~ '^STU-\d{4}-\d{4}$'
    ORDER BY student_code
  LOOP
    -- Generate new code with duplicate checking
    new_code := convert_student_code_to_vietnamese(student_record.student_code, student_record.id);
    
    -- Update if different
    IF new_code != student_record.student_code THEN
      UPDATE profiles
      SET student_code = new_code
      WHERE id = student_record.id;
      
      RAISE NOTICE 'Updated student % from % to %', student_record.id, student_record.student_code, new_code;
    END IF;
  END LOOP;
END $$;

-- Verify the update
SELECT COUNT(*) AS total_students,
       COUNT(CASE WHEN student_code ~ '^HS\d{4}\d{3}$' THEN 1 END) AS vietnamese_format,
       COUNT(CASE WHEN student_code ~ '^STU-\d{4}-\d{4}$' THEN 1 END) AS legacy_format,
       COUNT(CASE WHEN student_code IS NULL THEN 1 END) AS no_code
FROM profiles
WHERE role = 'student';


-- ============================================================================
-- STEP 5: Add check constraint for future inserts (OPTIONAL)
-- ============================================================================

/*
-- Uncomment to enforce Vietnamese format for all new student codes:
*/

-- Drop constraint if it exists (in case of re-running migration)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS student_code_format_check;

ALTER TABLE profiles
ADD CONSTRAINT student_code_format_check
CHECK (
  role != 'student' 
  OR student_code IS NULL 
  OR student_code ~ '^HS\d{4}\d{3}$'
  OR student_code ~ '^STU-\d{4}-\d{4}$'  -- Allow legacy format for backward compatibility
);

COMMENT ON CONSTRAINT student_code_format_check ON profiles IS 
'Ensures student codes follow Vietnamese format (HSYYYYNNN) or legacy format (STU-YYYY-NNNN)';


-- ============================================================================
-- STEP 6: Create index for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_student_code_vietnamese 
ON profiles(student_code)
WHERE role = 'student' AND student_code IS NOT NULL;

COMMENT ON INDEX idx_profiles_student_code_vietnamese IS 
'Optimizes queries filtering by student code for Vietnamese students';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check current format distribution
SELECT 
  CASE 
    WHEN student_code ~ '^HS\d{4}\d{3}$' THEN 'Vietnamese Format (HSYYYYNNN)'
    WHEN student_code ~ '^STU-\d{4}-\d{4}$' THEN 'Legacy Format (STU-YYYY-NNNN)'
    WHEN student_code IS NULL THEN 'No Code'
    ELSE 'Unknown Format'
  END AS format_type,
  COUNT(*) AS count
FROM profiles
WHERE role = 'student'
GROUP BY format_type
ORDER BY count DESC;

-- Find the highest student code number for current year
SELECT 
  student_code,
  full_name,
  created_at
FROM profiles
WHERE role = 'student'
  AND student_code ~ '^HS2025\d{3}$'
ORDER BY student_code DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================

/*
-- To rollback the update (if something goes wrong):

-- 1. Create backup table first:
CREATE TABLE profiles_backup_student_codes AS
SELECT id, student_code
FROM profiles
WHERE role = 'student' AND student_code IS NOT NULL;

-- 2. To restore from backup:
UPDATE profiles p
SET student_code = b.student_code
FROM profiles_backup_student_codes b
WHERE p.id = b.id;

-- 3. Drop backup when satisfied:
DROP TABLE profiles_backup_student_codes;
*/
