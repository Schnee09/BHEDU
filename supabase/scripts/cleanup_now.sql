-- ============================================
-- CLEANUP OLD DATA - COMPREHENSIVE
-- ============================================
-- Handles ALL tables referencing subjects
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: DELETE ALL OLD STUDENTS (Fresh Start)
DELETE FROM grades WHERE student_id IN (
  SELECT id FROM profiles WHERE role = 'student'
);

DELETE FROM attendance WHERE student_id IN (
  SELECT id FROM profiles WHERE role = 'student'
);

DELETE FROM profiles WHERE role = 'student';

-- STEP 2: DELETE FROM ALL TABLES REFERENCING SUBJECTS
-- Need to delete from these BEFORE deleting subjects

-- 2a. grades
DELETE FROM grades WHERE subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);

-- 2b. timetable_slots
DELETE FROM timetable_slots WHERE subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);

-- 2c. curriculum_standards
DELETE FROM curriculum_standards WHERE subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);

-- 2d. subject_group_subjects (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subject_group_subjects') THEN
    EXECUTE 'DELETE FROM subject_group_subjects WHERE subject_id IN (
      SELECT id FROM subjects WHERE code NOT IN (''TOAN'', ''VAN'', ''ANH'', ''LY'', ''HOA'', ''KHAC'')
    )';
  END IF;
END $$;

-- 2e. courses (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    EXECUTE 'DELETE FROM courses WHERE subject_id IN (
      SELECT id FROM subjects WHERE code NOT IN (''TOAN'', ''VAN'', ''ANH'', ''LY'', ''HOA'', ''KHAC'')
    )';
  END IF;
END $$;

-- 2f. profiles (teachers with subject_id)
UPDATE profiles SET subject_id = NULL 
WHERE role = 'teacher' AND subject_id IN (
  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')
);

-- STEP 3: NOW DELETE EXTRA SUBJECTS
DELETE FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC');

-- STEP 4: UPDATE SCHOOL SETTINGS
UPDATE school_settings 
SET value = 'Trung tâm Giáo dục Bùi Hoàng' 
WHERE key = 'school_name';

UPDATE school_settings 
SET value = 'TP. Hồ Chí Minh, Việt Nam' 
WHERE key = 'school_address';

-- VERIFICATION
SELECT 
  (SELECT COUNT(*) FROM subjects) as subjects,
  (SELECT COUNT(*) FROM profiles WHERE role = 'student') as students,
  (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') as teachers,
  (SELECT COUNT(*) FROM grades) as grades,
  (SELECT COUNT(*) FROM attendance) as attendance;

SELECT code, name FROM subjects ORDER BY code;

SELECT 'Cleanup complete! Run seed.sql next.' as status;
