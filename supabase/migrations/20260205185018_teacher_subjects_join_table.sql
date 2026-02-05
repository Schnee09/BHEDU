-- Migration: Database Schema Optimization - Teacher Subjects Join Table
-- Created: 2026-02-05
-- Purpose: Normalize teacher-subject relationships with proper many-to-many structure

-- ============================================
-- PHASE 1: CREATE ENUM TYPES
-- ============================================

-- Create user_role enum if not exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff', 'teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create teacher_type enum if not exists
DO $$ BEGIN
  CREATE TYPE teacher_type AS ENUM ('full_time', 'part_time', 'tutor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PHASE 2: CREATE TEACHER_SUBJECTS JOIN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, subject_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_profile ON teacher_subjects(profile_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject ON teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_primary ON teacher_subjects(profile_id, is_primary) WHERE is_primary = TRUE;

COMMENT ON TABLE teacher_subjects IS 'Many-to-many relationship between teachers and subjects they can teach';
COMMENT ON COLUMN teacher_subjects.is_primary IS 'Marks the teacher''s primary/main subject';

-- ============================================
-- PHASE 3: BACKFILL DATA FROM LEGACY COLUMNS
-- ============================================

-- Function to find subject ID by name (fuzzy match)
CREATE OR REPLACE FUNCTION find_subject_id_by_name(subject_name TEXT)
RETURNS UUID AS $$
DECLARE
  subject_uuid UUID;
BEGIN
  IF subject_name IS NULL OR subject_name = '' THEN
    RETURN NULL;
  END IF;
  
  -- Try exact match first
  SELECT id INTO subject_uuid
  FROM subjects
  WHERE LOWER(name) = LOWER(subject_name)
     OR LOWER(code) = LOWER(subject_name)
  LIMIT 1;
  
  IF subject_uuid IS NOT NULL THEN
    RETURN subject_uuid;
  END IF;
  
  -- Try partial match
  SELECT id INTO subject_uuid
  FROM subjects
  WHERE LOWER(name) LIKE '%' || LOWER(subject_name) || '%'
     OR LOWER(subject_name) LIKE '%' || LOWER(name) || '%'
  LIMIT 1;
  
  RETURN subject_uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Backfill from profiles.subject_id (single subject)
INSERT INTO teacher_subjects (profile_id, subject_id, is_primary)
SELECT 
  p.id,
  p.subject_id,
  TRUE  -- Mark as primary since it's their only subject
FROM profiles p
WHERE p.role = 'teacher'
  AND p.subject_id IS NOT NULL
ON CONFLICT (profile_id, subject_id) DO NOTHING;

-- Backfill from profiles.department (text field)
INSERT INTO teacher_subjects (profile_id, subject_id, is_primary)
SELECT 
  p.id,
  find_subject_id_by_name(p.department),
  (p.subject_id IS NULL)  -- Only mark as primary if they don't have subject_id set
FROM profiles p
WHERE p.role = 'teacher'
  AND p.department IS NOT NULL
  AND find_subject_id_by_name(p.department) IS NOT NULL
ON CONFLICT (profile_id, subject_id) DO NOTHING;

-- Backfill from teacher_profiles.teaching_subjects (UUID array)
DO $$
DECLARE
  teacher_rec RECORD;
  subject_uuid UUID;
  is_first BOOLEAN;
BEGIN
  FOR teacher_rec IN 
    SELECT tp.profile_id, tp.teaching_subjects
    FROM teacher_profiles tp
    WHERE tp.teaching_subjects IS NOT NULL 
      AND array_length(tp.teaching_subjects, 1) > 0
  LOOP
    is_first := TRUE;
    FOREACH subject_uuid IN ARRAY teacher_rec.teaching_subjects
    LOOP
      INSERT INTO teacher_subjects (profile_id, subject_id, is_primary)
      VALUES (teacher_rec.profile_id, subject_uuid, is_first)
      ON CONFLICT (profile_id, subject_id) DO NOTHING;
      
      is_first := FALSE;
    END LOOP;
  END LOOP;
END $$;

-- Backfill from teacher_profiles.specialization (text field)
INSERT INTO teacher_subjects (profile_id, subject_id, is_primary)
SELECT 
  tp.profile_id,
  find_subject_id_by_name(tp.specialization),
  FALSE  -- Don't mark as primary, specialization is secondary
FROM teacher_profiles tp
WHERE tp.specialization IS NOT NULL
  AND find_subject_id_by_name(tp.specialization) IS NOT NULL
ON CONFLICT (profile_id, subject_id) DO NOTHING;

-- ============================================
-- PHASE 4: CREATE CONVENIENCE VIEW
-- ============================================

CREATE OR REPLACE VIEW v_teacher_subjects AS
SELECT
  p.id AS profile_id,
  p.full_name,
  p.email,
  s.id AS subject_id,
  s.name AS subject_name,
  s.code AS subject_code,
  ts.is_primary,
  ts.created_at
FROM profiles p
JOIN teacher_subjects ts ON p.id = ts.profile_id
JOIN subjects s ON ts.subject_id = s.id
WHERE p.role = 'teacher';

COMMENT ON VIEW v_teacher_subjects IS 'Convenient view for querying teacher-subject relationships';

-- ============================================
-- PHASE 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Staff can manage all teacher subjects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teacher_subjects' 
    AND policyname = 'Staff can manage teacher_subjects'
  ) THEN
    CREATE POLICY "Staff can manage teacher_subjects" ON teacher_subjects
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('admin', 'staff')
        )
      );
  END IF;
END $$;

-- Teachers can view their own subjects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teacher_subjects' 
    AND policyname = 'Teachers can view own subjects'
  ) THEN
    CREATE POLICY "Teachers can view own subjects" ON teacher_subjects
      FOR SELECT TO authenticated
      USING (
        profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- PHASE 6: VERIFICATION
-- ============================================

-- Show migration summary
SELECT 
  'teacher_subjects' AS table_name,
  COUNT(*) AS total_records,
  COUNT(CASE WHEN is_primary THEN 1 END) AS primary_subjects,
  COUNT(DISTINCT profile_id) AS unique_teachers
FROM teacher_subjects;

-- Show teachers without subjects (needs manual review)
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.department,
  tp.specialization
FROM profiles p
LEFT JOIN teacher_profiles tp ON p.id = tp.profile_id
LEFT JOIN teacher_subjects ts ON p.id = ts.profile_id
WHERE p.role = 'teacher'
  AND ts.id IS NULL;

-- ============================================
-- DONE
-- ============================================
SELECT 'Teacher subjects join table created and backfilled successfully!' AS status;
