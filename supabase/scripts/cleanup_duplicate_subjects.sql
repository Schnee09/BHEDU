-- ============================================
-- Clean Up Duplicate Subjects in Database
-- ============================================
-- This script safely consolidates duplicate subjects by:
-- 1. Updating all foreign key references to point to the canonical (oldest) subject
-- 2. Deleting the duplicate subjects

-- Step 1: Create a temp table with canonical subjects (oldest by created_at for each code)
CREATE TEMP TABLE canonical_subjects AS
SELECT DISTINCT ON (LOWER(code)) 
  id as canonical_id, 
  LOWER(code) as lower_code
FROM subjects 
ORDER BY LOWER(code), created_at ASC;

-- Step 2: Update grades to point to canonical subjects
UPDATE grades g
SET subject_id = cs.canonical_id
FROM subjects s, canonical_subjects cs
WHERE g.subject_id = s.id 
  AND LOWER(s.code) = cs.lower_code
  AND s.id != cs.canonical_id;

-- Step 3: Update any other tables that reference subjects
-- (Check for other FKs like assignments, timetable_slots, etc.)

-- Update assignments if they have subject_id
UPDATE assignments a
SET subject_id = cs.canonical_id
FROM subjects s, canonical_subjects cs
WHERE a.subject_id = s.id 
  AND LOWER(s.code) = cs.lower_code
  AND s.id != cs.canonical_id;

-- Update timetable_slots if they have subject_id
UPDATE timetable_slots t
SET subject_id = cs.canonical_id
FROM subjects s, canonical_subjects cs
WHERE t.subject_id = s.id 
  AND LOWER(s.code) = cs.lower_code
  AND s.id != cs.canonical_id;

-- Step 4: Delete duplicate subjects (keep only canonical ones)
DELETE FROM subjects 
WHERE id NOT IN (SELECT canonical_id FROM canonical_subjects);

-- Step 5: Verify results
SELECT code, name, created_at FROM subjects ORDER BY code;

-- Cleanup
DROP TABLE IF EXISTS canonical_subjects;
