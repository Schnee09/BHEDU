-- Migration: Enhanced Attendance System
-- Description: Enhance attendance table with additional tracking fields
-- Date: 2025-11-14

-- Add new columns to attendance table
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS check_in_time TIME,
  ADD COLUMN IF NOT EXISTS check_out_time TIME,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id);

-- Update status column to support more attendance types
DO $$ 
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'attendance_status_check'
  ) THEN
    ALTER TABLE attendance DROP CONSTRAINT attendance_status_check;
  END IF;
  
  -- Add new constraint with more status options
  ALTER TABLE attendance 
    ADD CONSTRAINT attendance_status_check 
    CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day'));
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

-- Create attendance_reports table for cached reports
DROP TABLE IF EXISTS attendance_reports CASCADE;

CREATE TABLE attendance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, student, class
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total_days INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  late_count INTEGER,
  excused_count INTEGER,
  attendance_rate DECIMAL(5,2), -- percentage
  report_data JSONB, -- detailed report data
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for reports
CREATE INDEX IF NOT EXISTS idx_attendance_reports_type ON attendance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_class ON attendance_reports(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_student ON attendance_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_dates ON attendance_reports(date_from, date_to);

-- Enable RLS on attendance_reports
ALTER TABLE attendance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_reports
CREATE POLICY "Admins can manage attendance reports"
  ON attendance_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can view reports for their classes"
  ON attendance_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND (
      class_id IN (
        SELECT id FROM classes WHERE teacher_id = auth.uid()
      )
      OR student_id IN (
        SELECT student_id FROM enrollments
        WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
      )
    )
  );

CREATE POLICY "Students can view their own reports"
  ON attendance_reports
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Function to calculate attendance rate
CREATE OR REPLACE FUNCTION calculate_attendance_rate(
  p_student_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_days INTEGER;
  present_days INTEGER;
BEGIN
  -- Count total attendance records
  SELECT COUNT(*) INTO total_days
  FROM attendance
  WHERE student_id = p_student_id
    AND date BETWEEN p_date_from AND p_date_to;
  
  IF total_days = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count present days (including late and half_day)
  SELECT COUNT(*) INTO present_days
  FROM attendance
  WHERE student_id = p_student_id
    AND date BETWEEN p_date_from AND p_date_to
    AND status IN ('present', 'late', 'half_day');
  
  RETURN ROUND((present_days::DECIMAL / total_days::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get class attendance for a specific date
CREATE OR REPLACE FUNCTION get_class_attendance(
  p_class_id UUID,
  p_date DATE
)
RETURNS TABLE (
  student_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  student_number VARCHAR,
  status VARCHAR,
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.student_id,
    p.first_name,
    p.last_name,
    p.email,
    p.student_id as student_number,
    COALESCE(a.status, 'unmarked'::VARCHAR) as status,
    a.check_in_time,
    a.check_out_time,
    a.notes
  FROM enrollments e
  JOIN profiles p ON e.student_id = p.id
  LEFT JOIN attendance a ON a.student_id = e.student_id 
    AND a.class_id = p_class_id 
    AND a.date = p_date
  WHERE e.class_id = p_class_id
  ORDER BY p.last_name, p.first_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN attendance.check_in_time IS 'Time when student checked in';
COMMENT ON COLUMN attendance.check_out_time IS 'Time when student checked out';
COMMENT ON COLUMN attendance.notes IS 'Additional notes about attendance (reason for absence, etc.)';
COMMENT ON COLUMN attendance.marked_by IS 'User who marked the attendance';
COMMENT ON TABLE attendance_reports IS 'Cached attendance reports for performance';
COMMENT ON FUNCTION calculate_attendance_rate IS 'Calculate attendance percentage for a student over a date range';
COMMENT ON FUNCTION get_class_attendance IS 'Get all students in a class with their attendance status for a specific date';
