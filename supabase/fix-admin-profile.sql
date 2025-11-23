-- Fix profile user_id for admin user
-- Run this in Supabase SQL Editor

UPDATE profiles
SET user_id = id
WHERE email = 'admin@bhedu.com' 
  AND user_id IS NULL;

-- Verify the fix
SELECT id, user_id, email, full_name, role
FROM profiles
WHERE email = 'admin@bhedu.com';
