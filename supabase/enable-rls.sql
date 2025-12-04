-- ================================================================
-- Enable Row Level Security (RLS) on All Tables
-- This fixes the security warnings from Supabase linter
-- ================================================================

-- Enable RLS on main tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lookup/reference tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'classes', 'enrollments', 'attendance', 
    'grades', 'assignments', 'academic_years', 'fee_types',
    'grading_scales', 'payment_methods'
  )
ORDER BY tablename;
