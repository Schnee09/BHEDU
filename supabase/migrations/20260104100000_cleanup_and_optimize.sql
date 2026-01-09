-- Migration: Database Cleanup and Optimization
-- Created: 2026-01-04
-- Purpose: Clean orphan data, add indexes, optimize structure

-- ============================================
-- PART 1: CLEAN ORPHAN DATA
-- ============================================

-- Delete grades with NULL student_id (orphaned records)
DELETE FROM grades WHERE student_id IS NULL;

-- Delete grades with invalid class_id (orphaned records)
DELETE FROM grades g 
WHERE class_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.id = g.class_id);

-- Delete grades with invalid subject_id (orphaned records)
DELETE FROM grades g 
WHERE subject_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = g.subject_id);

-- ============================================
-- PART 2: ADD PERFORMANCE INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Grades indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester ON grades(semester);
CREATE INDEX IF NOT EXISTS idx_grades_class_subject ON grades(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_semester ON grades(student_id, semester);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

-- ============================================
-- PART 3: CLEAN UP SCHEMA METADATA
-- ============================================

-- Drop any leftover backup tables
DROP TABLE IF EXISTS grades_backup CASCADE;
DROP TABLE IF EXISTS profiles_backup CASCADE;
DROP TABLE IF EXISTS _backup_tables CASCADE;

-- ============================================
-- PART 4: VERIFY DATA INTEGRITY
-- ============================================

DO $$
DECLARE
  orphan_grades INTEGER;
  total_grades INTEGER;
  total_subjects INTEGER;
  total_classes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_grades FROM grades;
  SELECT COUNT(*) INTO orphan_grades FROM grades WHERE student_id IS NULL OR class_id IS NULL;
  SELECT COUNT(*) INTO total_subjects FROM subjects;
  SELECT COUNT(*) INTO total_classes FROM classes;
  
  RAISE NOTICE '=== Database Cleanup Complete ===';
  RAISE NOTICE 'Total grades: %', total_grades;
  RAISE NOTICE 'Orphan grades: %', orphan_grades;
  RAISE NOTICE 'Valid subjects: %', total_subjects;
  RAISE NOTICE 'Valid classes: %', total_classes;
END $$;

SELECT 'Database cleanup and optimization complete!' AS status;
