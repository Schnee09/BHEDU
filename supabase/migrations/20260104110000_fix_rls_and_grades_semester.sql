-- Migration: Fix RLS Policies and Add Semester Link to Grades
-- Created: 2026-01-04
-- Purpose: 
--   1. Ensure RLS policies allow public SELECT on core tables
--   2. Add semester_id FK to grades for proper filtering

-- ============================================
-- PART 1: FIX RLS POLICIES
-- ============================================

-- Subjects: Ensure everyone can SELECT
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view subjects" ON subjects;
CREATE POLICY "Everyone can view subjects" ON subjects 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage subjects" ON subjects;
CREATE POLICY "Admin can manage subjects" ON subjects 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Semesters: Ensure everyone can SELECT
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view semesters" ON semesters;
CREATE POLICY "Everyone can view semesters" ON semesters 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage semesters" ON semesters;
CREATE POLICY "Admin can manage semesters" ON semesters 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Calendar Events: Ensure everyone can SELECT
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view calendar" ON calendar_events;
CREATE POLICY "Everyone can view calendar" ON calendar_events 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage calendar" ON calendar_events;
CREATE POLICY "Admin can manage calendar" ON calendar_events 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Timetable Slots: Ensure everyone can SELECT
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view timetable" ON timetable_slots;
CREATE POLICY "Everyone can view timetable" ON timetable_slots 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage timetable" ON timetable_slots;
CREATE POLICY "Staff can manage timetable" ON timetable_slots 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Classes: Ensure everyone can SELECT
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view classes" ON classes;
CREATE POLICY "Everyone can view classes" ON classes 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage classes" ON classes;
CREATE POLICY "Admin can manage classes" ON classes 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PART 2: ADD SEMESTER_ID TO GRADES
-- ============================================

-- Add semester_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grades' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE grades ADD COLUMN semester_id UUID REFERENCES semesters(id);
    RAISE NOTICE 'Added semester_id column to grades';
  END IF;
END $$;

-- Create index for semester filtering
CREATE INDEX IF NOT EXISTS idx_grades_semester ON grades(semester_id);

-- Backfill semester_id from semester text field
-- Map '1' -> HK1, '2' -> HK2
UPDATE grades g
SET semester_id = s.id
FROM semesters s
WHERE g.semester_id IS NULL
  AND (
    (g.semester = '1' AND s.code LIKE '%HK1') OR
    (g.semester = '2' AND s.code LIKE '%HK2')
  )
  AND s.is_active = TRUE;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('subjects', 'semesters', 'calendar_events', 'timetable_slots', 'classes')
    AND policyname LIKE 'Everyone can view%';
  
  RAISE NOTICE 'Verified % SELECT policies created', policy_count;
END $$;

SELECT 'Migration complete!' AS status;
