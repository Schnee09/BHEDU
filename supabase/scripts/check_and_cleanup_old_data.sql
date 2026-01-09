-- Clean up old data that doesn't match new structure
-- Run in Supabase SQL Editor

-- ============================================
-- 1. CHECK CURRENT STATE
-- ============================================

-- Count subjects - should only have 6
SELECT 'SUBJECTS' as check_type, COUNT(*) as total FROM subjects;
SELECT code, name FROM subjects ORDER BY code;

-- Count students with email (old structure)
SELECT 'STUDENTS_WITH_EMAIL' as check_type, COUNT(*) as total 
FROM profiles 
WHERE role = 'student' AND email IS NOT NULL;

-- Count students with old code format (not HSYYYYNNN)
SELECT 'STUDENTS_OLD_CODE' as check_type, COUNT(*) as total 
FROM profiles 
WHERE role = 'student' 
  AND student_code IS NOT NULL 
  AND student_code !~ '^HS\d{4}\d{3}$';

-- Sample of old student codes
SELECT full_name, email, student_code 
FROM profiles 
WHERE role = 'student' 
  AND student_code IS NOT NULL 
  AND student_code !~ '^HS\d{4}\d{3}$'
LIMIT 10;

-- Check school settings
SELECT * FROM school_settings WHERE key = 'school_name';

-- ============================================
-- 2. CLEANUP OPTIONS (UNCOMMENT TO RUN)
-- ============================================

-- Option A: Delete ALL old students and keep only seed data
-- WARNING: This will delete all existing student data!
/*
DELETE FROM grades WHERE student_id IN (
  SELECT id FROM profiles WHERE role = 'student'
);
DELETE FROM attendance WHERE student_id IN (
  SELECT id FROM profiles WHERE role = 'student'
);
DELETE FROM profiles WHERE role = 'student';
*/

-- Option B: Remove email from students (keep students, just clear email)
/*
UPDATE profiles 
SET email = NULL 
WHERE role = 'student';
*/

-- Option C: Delete subjects not in the 6 core subjects
/*
DELETE FROM grades WHERE subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);
DELETE FROM timetable_slots WHERE subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);
DELETE FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC');
*/

-- Option D: Update school settings
/*
UPDATE school_settings 
SET value = 'Trung tâm Giáo dục Bùi Hoàng' 
WHERE key = 'school_name';
*/

-- ============================================
-- 3. VERIFY AFTER CLEANUP
-- ============================================

SELECT 
  (SELECT COUNT(*) FROM subjects) as subjects,
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') as teachers,
  (SELECT COUNT(*) FROM grades) as grades,
  (SELECT COUNT(*) FROM attendance) as attendance;
