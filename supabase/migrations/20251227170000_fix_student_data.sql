-- Fix student grade_level and gender for existing data
-- Run in Supabase SQL Editor

-- Update students that are enrolled in classes - derive grade_level from class name
WITH class_students AS (
  SELECT DISTINCT 
    p.id as student_id,
    c.name as class_name,
    CASE 
      WHEN c.name LIKE '10%' THEN 'Lớp 10'
      WHEN c.name LIKE '11%' THEN 'Lớp 11'
      WHEN c.name LIKE '12%' THEN 'Lớp 12'
      ELSE 'Lớp 10'
    END as grade_level
  FROM profiles p
  JOIN enrollments e ON p.id = e.student_id
  JOIN classes c ON e.class_id = c.id
  WHERE p.role = 'student'
)
UPDATE profiles
SET grade_level = cs.grade_level
FROM class_students cs
WHERE profiles.id = cs.student_id
  AND (profiles.grade_level IS NULL OR profiles.grade_level = '');

-- Update gender randomly for students without gender
UPDATE profiles
SET gender = CASE 
  WHEN random() < 0.45 THEN 'male'
  WHEN random() < 0.9 THEN 'female'
  ELSE 'other'
END
WHERE role = 'student' AND (gender IS NULL OR gender = '');

-- Update status for students without status
UPDATE profiles
SET status = 'active'
WHERE role = 'student' AND status IS NULL;

-- Verify
SELECT 
  grade_level, 
  gender, 
  COUNT(*) as count
FROM profiles
WHERE role = 'student'
GROUP BY grade_level, gender
ORDER BY grade_level, gender;
