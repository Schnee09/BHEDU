-- ============================================
-- REMOVE DUPLICATE CLASSES
-- ============================================
-- Each class name has 2 rows - keep only one
-- ============================================

-- Step 1: Find duplicates to delete (keep the first one for each name)
WITH duplicates AS (
  SELECT id, name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
  FROM classes
)
SELECT id, name FROM duplicates WHERE rn > 1;

-- Step 2: Delete related data for duplicate class IDs
DELETE FROM grades WHERE class_id IN (
  SELECT id FROM (
    SELECT id, name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
    FROM classes
  ) d WHERE rn > 1
);

DELETE FROM attendance WHERE class_id IN (
  SELECT id FROM (
    SELECT id, name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
    FROM classes
  ) d WHERE rn > 1
);

DELETE FROM timetable_slots WHERE class_id IN (
  SELECT id FROM (
    SELECT id, name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
    FROM classes
  ) d WHERE rn > 1
);

-- Step 3: Delete duplicate classes (keep first one per name)
DELETE FROM classes WHERE id IN (
  SELECT id FROM (
    SELECT id, name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
    FROM classes
  ) d WHERE rn > 1
);

-- Verification
SELECT COUNT(*) as class_count FROM classes;
SELECT name FROM classes ORDER BY name;

SELECT 'Duplicates removed! Should be 17 classes now.' as status;
