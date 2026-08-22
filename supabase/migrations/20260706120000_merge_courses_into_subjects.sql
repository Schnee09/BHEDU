-- ============================================================
-- Migration: Merge courses → subjects
-- Drop courses table, rename classes.course_id → subject_id
-- ============================================================

-- STEP 1: Map existing class course_id → subject_id
-- (Match courses to subjects by lowercased name)
DO $$
DECLARE
  r RECORD;
  matched_subject_id UUID;
BEGIN
  FOR r IN SELECT id, course_id, name FROM classes WHERE course_id IS NOT NULL LOOP
    -- Find matching subject by name (case-insensitive)
    SELECT s.id INTO matched_subject_id
    FROM subjects s
    JOIN courses c ON LOWER(c.name) = LOWER(s.name)
    WHERE c.id = r.course_id
    LIMIT 1;

    IF matched_subject_id IS NOT NULL THEN
      UPDATE classes SET subject_id_new = matched_subject_id WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- STEP 2: Add new subject_id column to classes
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- STEP 3: Populate new subject_id from courses via name matching
UPDATE classes c
SET subject_id = s.id
FROM courses cr
JOIN subjects s ON LOWER(cr.name) = LOWER(s.name)
WHERE c.course_id = cr.id
  AND c.subject_id IS NULL;

-- STEP 4: Drop old FK constraint and course_id column
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_course_id_fkey;
ALTER TABLE classes DROP COLUMN IF EXISTS course_id;

-- STEP 5: Add index on new subject_id
CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON classes(subject_id);

-- STEP 6: Drop the courses table (CASCADE removes dependent views/policies)
DROP TABLE IF EXISTS courses CASCADE;

-- DONE
SELECT
  COUNT(*) AS classes_with_subject,
  (SELECT COUNT(*) FROM classes WHERE subject_id IS NULL) AS classes_without_subject
FROM classes
WHERE subject_id IS NOT NULL;
