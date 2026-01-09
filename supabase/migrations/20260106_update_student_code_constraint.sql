-- Migration: Update Student Code Format Constraint
-- Created: 2026-01-06
-- Purpose: Ensure constraint accepts 4-digit suffix format (HS{YEAR}{4-DIGIT-SEQ})

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS student_code_format_check;

-- Add updated constraint that accepts both formats
ALTER TABLE profiles
ADD CONSTRAINT student_code_format_check
CHECK (
  role != 'student' 
  OR student_code IS NULL 
  OR student_code ~ '^HS\d{4}\d{4}$'           -- New format: HS20260001 (4-digit suffix)
  OR student_code ~ '^HS\d{4}\d{3}$'           -- Legacy 3-digit: HS2026001 
  OR student_code ~ '^STU-\d{4}-\d{4}$'        -- Legacy format: STU-2026-0001
);

COMMENT ON CONSTRAINT student_code_format_check ON profiles IS 
'Ensures student codes follow Vietnamese format (HS{YEAR}{SEQ}) or legacy format (STU-YYYY-NNNN)';

-- Verify constraint
SELECT 'Student code constraint updated successfully' AS status;
