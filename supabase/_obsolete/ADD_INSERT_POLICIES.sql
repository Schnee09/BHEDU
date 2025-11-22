-- Add INSERT policy for profiles to allow service role / admin to create profiles
-- Run this in Supabase SQL Editor if you're getting "permission denied" errors during seeding

-- Drop existing policies if they exist (ignore errors if they don't)
DROP POLICY IF EXISTS "Allow service role insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow service role insert classes" ON classes;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert assignments" ON assignments;
DROP POLICY IF EXISTS "Allow service role insert grades" ON grades;
DROP POLICY IF EXISTS "Allow service role insert attendance" ON attendance;

-- Create INSERT policies that allow anyone to insert (service role will use these)
CREATE POLICY "Allow service role insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert classes" ON classes
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow service role insert enrollments" ON enrollments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert assignments" ON assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert grades" ON grades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert attendance" ON attendance
  FOR INSERT WITH CHECK (true);

-- This allows the service role key to INSERT into these tables
-- The service role bypasses RLS, but these policies make it explicit
