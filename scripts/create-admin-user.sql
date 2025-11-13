-- ============================================
-- Admin User Setup Script for BH-EDU
-- ============================================
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql/new

-- INSTRUCTIONS:
-- 1. First, sign up a user at your Vercel app: https://your-app.vercel.app/signup
-- 2. Go to Supabase Dashboard > Authentication > Users
-- 3. Find the user you just created and copy their User ID
-- 4. Replace 'YOUR_USER_ID' and 'your-email@example.com' below
-- 5. Run this SQL script

-- ============================================
-- Option 1: Update existing user to admin
-- ============================================
-- Use this if you've already signed up

UPDATE profiles
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email = 'your-email@example.com';

-- ============================================
-- Option 2: Create admin profile directly
-- ============================================
-- Use this if the profile doesn't exist yet
-- Replace YOUR_USER_ID with the actual UUID from auth.users

/*
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'YOUR_USER_ID'::uuid,
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';
*/

-- ============================================
-- Verify admin user exists
-- ============================================
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.role = 'admin';

-- ============================================
-- Create additional admin users (if needed)
-- ============================================
-- First sign them up at /signup, then run:

/*
UPDATE profiles
SET role = 'admin'
WHERE email IN (
  'admin2@example.com',
  'admin3@example.com'
);
*/

-- ============================================
-- Useful queries for user management
-- ============================================

-- View all users with their roles
/*
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
*/

-- Count users by role
/*
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role;
*/

-- ============================================
-- ✅ Done!
-- ============================================
-- After running this, you should be able to:
-- 1. Login at: https://your-app.vercel.app/login
-- 2. Access admin features in the dashboard
-- 3. Create other users via the admin interface
