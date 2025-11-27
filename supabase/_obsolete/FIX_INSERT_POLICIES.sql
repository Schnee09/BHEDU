-- Quick Fix: Add INSERT Policies
-- Run this in Supabase Dashboard → SQL Editor if seed script fails with "permission denied"

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow service role insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow service role insert classes" ON classes;
DROP POLICY IF EXISTS "Allow service role insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow service role insert assignments" ON assignments;
DROP POLICY IF EXISTS "Allow service role insert grades" ON grades;
DROP POLICY IF EXISTS "Allow service role insert attendance" ON attendance;

-- Add INSERT policies
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

-- Done! Now run: npx tsx web/scripts/seed.ts
