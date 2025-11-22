-- Temporary: Disable RLS for seeding
-- ⚠️ Run this, then run seed script, then run ENABLE_RLS.sql

BEGIN;

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Now run: npx tsx scripts/seed.ts
-- Then immediately run: ENABLE_RLS.sql
