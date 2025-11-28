-- Check current RLS policies for attendance and assignments tables
-- Run this in Supabase SQL Editor to see what policies are blocking admin access

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('attendance', 'assignments', 'classes')
AND schemaname = 'public';

-- Check attendance policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'attendance'
AND schemaname = 'public';

-- Check assignments policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'assignments'
AND schemaname = 'public';

-- Check classes policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'classes'
AND schemaname = 'public';

-- Check if admin role helper function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%';
