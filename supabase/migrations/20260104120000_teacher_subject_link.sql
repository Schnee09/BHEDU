-- Migration: Add subject_id FK to profiles for teachers
-- Created: 2026-01-04
-- Purpose: Link teachers to subjects for better data relationships

-- ============================================
-- PART 1: ADD SUBJECT_ID COLUMN
-- ============================================

-- Add subject_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subject_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subject_id UUID REFERENCES subjects(id);
    RAISE NOTICE 'Added subject_id column to profiles';
  END IF;
END $$;

-- ============================================
-- PART 2: BACKFILL FROM DEPARTMENT
-- ============================================

-- Match teachers to subjects by department name
UPDATE profiles p
SET subject_id = s.id
FROM subjects s
WHERE p.role = 'teacher'
  AND p.department IS NOT NULL
  AND p.subject_id IS NULL
  AND p.department = s.name;

-- ============================================
-- PART 3: CREATE INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_subject ON profiles(subject_id);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  teachers_with_subject INTEGER;
  teachers_without_subject INTEGER;
BEGIN
  SELECT COUNT(*) INTO teachers_with_subject 
  FROM profiles 
  WHERE role = 'teacher' AND subject_id IS NOT NULL;
  
  SELECT COUNT(*) INTO teachers_without_subject 
  FROM profiles 
  WHERE role = 'teacher' AND subject_id IS NULL AND department IS NOT NULL;
  
  RAISE NOTICE 'Teachers with subject_id: %', teachers_with_subject;
  RAISE NOTICE 'Teachers without subject_id: %', teachers_without_subject;
END $$;

SELECT 'Migration complete!' AS status;
