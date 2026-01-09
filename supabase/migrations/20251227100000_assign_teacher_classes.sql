-- CRITICAL FIX: Check and assign Test Teacher to classes
-- Run each section separately in Supabase SQL Editor

-- ========================================
-- SECTION 1: Check Test Teacher's profile
-- ========================================
SELECT 
  id, 
  user_id,
  full_name, 
  email, 
  role 
FROM profiles 
WHERE email LIKE '%teacher%' 
   OR full_name ILIKE '%test teacher%'
   OR role = 'teacher'
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- SECTION 2: Check which classes Test Teacher is assigned to
-- Copy the Test Teacher profile ID from above, then run:
-- ========================================
-- Replace 'PASTE_PROFILE_ID_HERE' with actual ID
-- SELECT c.name, c.teacher_id
-- FROM classes c
-- WHERE c.teacher_id = 'PASTE_PROFILE_ID_HERE';

-- ========================================
-- SECTION 3: Assign 3 classes to Test Teacher
-- Replace 'PASTE_PROFILE_ID_HERE' with actual ID
-- ========================================
-- UPDATE classes
-- SET teacher_id = 'PASTE_PROFILE_ID_HERE'
-- WHERE id IN (
--   SELECT id FROM classes ORDER BY name LIMIT 3
-- );

-- ========================================
-- SECTION 4: Verify the assignment
-- ========================================
SELECT 
  c.name, 
  c.teacher_id, 
  p.full_name as teacher_name, 
  p.email
FROM classes c
LEFT JOIN profiles p ON c.teacher_id = p.id
ORDER BY c.name;
