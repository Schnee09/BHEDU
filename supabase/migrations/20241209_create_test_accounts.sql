-- =====================================================
-- CREATE TEST ACCOUNTS FOR ALL 4 ROLES
-- Password: test123 for all accounts
-- 
-- Run this in Supabase SQL Editor
-- =====================================================

-- Note: This script creates users in auth.users and profiles
-- You need to run this with service_role or as superuser

-- =====================================================
-- METHOD 1: Using Supabase Auth (Recommended)
-- =====================================================
-- Create users via Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Create each user with email/password below
-- 4. Then run the profile updates below

-- After creating users in Auth, update their profiles:

-- Get user IDs first (run this to see existing users):
SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- =====================================================
-- UPDATE PROFILES FOR TEST USERS
-- =====================================================
-- Replace the UUIDs with actual user_id from auth.users

-- For Admin user (after creating admin@test.com)
-- UPDATE profiles SET role = 'admin', full_name = 'Test Admin' 
-- WHERE email = 'admin@test.com';

-- For Staff user (after creating staff@test.com)  
-- UPDATE profiles SET role = 'staff', full_name = 'Test Staff'
-- WHERE email = 'staff@test.com';

-- For Teacher user (after creating teacher@test.com)
-- UPDATE profiles SET role = 'teacher', full_name = 'Test Teacher'
-- WHERE email = 'teacher@test.com';

-- For Student user (after creating student@test.com)
-- UPDATE profiles SET role = 'student', full_name = 'Test Student'
-- WHERE email = 'student@test.com';

-- =====================================================
-- METHOD 2: Direct SQL (if you have superuser access)
-- =====================================================

-- Create admin user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT 
  gen_random_uuid(), 
  'admin@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Admin"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com');

-- Create staff user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT 
  gen_random_uuid(),
  'staff@test.com', 
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Staff"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'staff@test.com');

-- Create teacher user
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT
  gen_random_uuid(),
  'teacher@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Teacher"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@test.com');

-- Create student user  
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT
  gen_random_uuid(),
  'student@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Student"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@test.com');

-- =====================================================
-- CREATE PROFILES FOR TEST USERS
-- =====================================================

-- Wait a moment for triggers, then create profiles
-- (Some Supabase setups auto-create profiles via trigger)

-- Insert profile for admin
INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'admin@test.com',
  'Test Admin',
  'admin',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'admin@test.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@test.com');

-- Insert profile for staff
INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  'staff@test.com',
  'Test Staff',
  'staff',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'staff@test.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'staff@test.com');

-- Insert profile for teacher
INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  'teacher@test.com',
  'Test Teacher',
  'teacher',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'teacher@test.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'teacher@test.com');

-- Insert profile for student
INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  'student@test.com',
  'Test Student',
  'student',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'student@test.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student@test.com');

-- =====================================================
-- VERIFY TEST ACCOUNTS
-- =====================================================

SELECT 
  p.full_name,
  p.email,
  p.role,
  CASE WHEN u.id IS NOT NULL THEN '✅ Has Auth' ELSE '❌ No Auth' END as auth_status
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.email LIKE '%@test.com'
ORDER BY p.role;
