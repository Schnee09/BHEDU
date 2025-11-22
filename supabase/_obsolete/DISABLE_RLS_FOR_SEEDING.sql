-- Temporarily disable RLS for seeding (run this before seed script)
-- IMPORTANT: Re-enable RLS after seeding!

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Run your seed script now
-- Then run ENABLE_RLS_AFTER_SEEDING.sql
