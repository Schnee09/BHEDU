-- Check classes table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Check if teacher_id exists
SELECT COUNT(*) as has_teacher_id
FROM information_schema.columns 
WHERE table_name = 'classes' AND column_name = 'teacher_id';

-- If teacher_id doesn't exist, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN teacher_id UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added teacher_id column to classes';
  ELSE
    RAISE NOTICE 'teacher_id column already exists';
  END IF;
END $$;

-- Now assign teachers
WITH teacher_list AS (
  SELECT id, full_name,
    ROW_NUMBER() OVER (ORDER BY full_name) as teacher_num
  FROM profiles WHERE role = 'teacher'
),
class_list AS (
  SELECT id, name,
    ROW_NUMBER() OVER (ORDER BY name) as class_num
  FROM classes
)
UPDATE classes c
SET teacher_id = (
  SELECT t.id FROM teacher_list t
  WHERE t.teacher_num = ((cl.class_num - 1) % (SELECT COUNT(*) FROM teacher_list) + 1)
)
FROM class_list cl
WHERE c.id = cl.id;

-- Verify
SELECT c.name, p.full_name as teacher
FROM classes c
LEFT JOIN profiles p ON c.teacher_id = p.id
ORDER BY c.name;
