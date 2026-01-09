-- ============================================
-- FIX DATA RELATIONSHIPS
-- ============================================
-- Clean duplicates and link all data properly
-- ============================================

-- STEP 0: Remove duplicate students (keep first one per student_code)
DELETE FROM grades WHERE student_id IN (
  SELECT id FROM (
    SELECT id, student_code,
      ROW_NUMBER() OVER (PARTITION BY student_code ORDER BY created_at ASC, id ASC) as rn
    FROM profiles WHERE role = 'student' AND student_code IS NOT NULL
  ) d WHERE rn > 1
);

DELETE FROM attendance WHERE student_id IN (
  SELECT id FROM (
    SELECT id, student_code,
      ROW_NUMBER() OVER (PARTITION BY student_code ORDER BY created_at ASC, id ASC) as rn
    FROM profiles WHERE role = 'student' AND student_code IS NOT NULL
  ) d WHERE rn > 1
);

DELETE FROM profiles WHERE id IN (
  SELECT id FROM (
    SELECT id, student_code,
      ROW_NUMBER() OVER (PARTITION BY student_code ORDER BY created_at ASC, id ASC) as rn
    FROM profiles WHERE role = 'student' AND student_code IS NOT NULL
  ) d WHERE rn > 1
);

-- STEP 1: Link teachers to subjects
UPDATE profiles p
SET subject_id = s.id
FROM subjects s
WHERE p.role = 'teacher'
  AND p.department = s.name
  AND p.subject_id IS NULL;

-- STEP 2: Ensure grades link to valid subjects
UPDATE grades
SET subject_id = (SELECT id FROM subjects LIMIT 1)
WHERE subject_id IS NULL;

-- STEP 3: Ensure grades have valid class_id
UPDATE grades g
SET class_id = (
  SELECT c.id FROM classes c
  WHERE c.name LIKE regexp_replace(p.grade_level, '[^0-9]', '', 'g') || '%'
  LIMIT 1
)
FROM profiles p
WHERE g.student_id = p.id
  AND g.class_id IS NULL
  AND p.grade_level IS NOT NULL;

-- STEP 4: Ensure attendance has valid class_id
UPDATE attendance a
SET class_id = (
  SELECT c.id FROM classes c
  WHERE c.name LIKE regexp_replace(p.grade_level, '[^0-9]', '', 'g') || '%'
  LIMIT 1
)
FROM profiles p
WHERE a.student_id = p.id
  AND a.class_id IS NULL
  AND p.grade_level IS NOT NULL;

-- VERIFICATION
SELECT 'Teachers with subject' as check_type, COUNT(*) as count 
FROM profiles WHERE role = 'teacher' AND subject_id IS NOT NULL;

SELECT 'Total students' as check_type, COUNT(*) as count
FROM profiles WHERE role = 'student';

SELECT 'Total grades' as check_type, COUNT(*) as count FROM grades;

SELECT 'Total attendance' as check_type, COUNT(*) as count FROM attendance;

SELECT 'Done!' as status;
