-- ============================================
-- CLEAN OLD CLASSES
-- ============================================
-- Keep only: 10A1-3, 11A1-3, 12A1-3, 6A-B, 7A-B, 8A-B, 9A-B
-- ============================================

-- Step 1: Delete related data for old classes
DELETE FROM grades WHERE class_id NOT IN (
  SELECT id FROM classes WHERE name IN (
    '10A1', '10A2', '10A3',
    '11A1', '11A2', '11A3',
    '12A1', '12A2', '12A3',
    '6A', '6B',
    '7A', '7B',
    '8A', '8B',
    '9A', '9B'
  )
);

DELETE FROM attendance WHERE class_id NOT IN (
  SELECT id FROM classes WHERE name IN (
    '10A1', '10A2', '10A3',
    '11A1', '11A2', '11A3',
    '12A1', '12A2', '12A3',
    '6A', '6B',
    '7A', '7B',
    '8A', '8B',
    '9A', '9B'
  )
);

DELETE FROM timetable_slots WHERE class_id NOT IN (
  SELECT id FROM classes WHERE name IN (
    '10A1', '10A2', '10A3',
    '11A1', '11A2', '11A3',
    '12A1', '12A2', '12A3',
    '6A', '6B',
    '7A', '7B',
    '8A', '8B',
    '9A', '9B'
  )
);

-- Step 2: Delete old classes
DELETE FROM classes WHERE name NOT IN (
  '10A1', '10A2', '10A3',
  '11A1', '11A2', '11A3',
  '12A1', '12A2', '12A3',
  '6A', '6B',
  '7A', '7B',
  '8A', '8B',
  '9A', '9B'
);

-- Verification
SELECT name FROM classes ORDER BY name;
SELECT COUNT(*) as class_count FROM classes;

SELECT 'Old classes deleted!' as status;
