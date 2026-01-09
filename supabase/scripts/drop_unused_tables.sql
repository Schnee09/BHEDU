-- ============================================
-- DROP UNUSED TABLES
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

-- Drop empty/unused tables
DROP TABLE IF EXISTS curriculum_standards CASCADE;
DROP TABLE IF EXISTS subject_group_subjects CASCADE;
DROP TABLE IF EXISTS subject_groups CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_categories CASCADE;
DROP TABLE IF EXISTS grade_categories CASCADE;
DROP TABLE IF EXISTS grading_scales CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS report_exports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;

-- Verification - show remaining tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

SELECT 'Legacy tables dropped!' as status;
