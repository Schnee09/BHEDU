-- Vietnamese Education System Grade Components
-- This migration adds support for Vietnamese grading system with proper weight calculations

-- Grade component types (Thành phần điểm)
CREATE TYPE grade_component_type AS ENUM (
  'oral',           -- Điểm miệng
  'fifteen_min',    -- Điểm 15 phút
  'one_period',     -- Điểm 1 tiết (45 phút)
  'midterm',        -- Điểm giữa kỳ
  'final'           -- Điểm cuối kỳ/học kỳ
);

-- Conduct grade types (Hạnh kiểm)
CREATE TYPE conduct_type AS ENUM (
  'excellent',      -- Xuất sắc
  'good',          -- Tốt
  'fair',          -- Khá
  'average',       -- Trung bình
  'weak'           -- Yếu
);

-- Add fields to grades table for Vietnamese system
ALTER TABLE grades ADD COLUMN IF NOT EXISTS component_type grade_component_type DEFAULT 'one_period';
ALTER TABLE grades ADD COLUMN IF NOT EXISTS semester VARCHAR(10); -- HK1, HK2
ALTER TABLE grades ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id);

-- Create grade components configuration table
CREATE TABLE IF NOT EXISTS grade_component_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_type grade_component_type NOT NULL,
  name_vi VARCHAR(50) NOT NULL,  -- Vietnamese name
  name_en VARCHAR(50) NOT NULL,  -- English name
  weight INTEGER NOT NULL,       -- Weight multiplier (1, 1, 2, 3)
  order_index INTEGER NOT NULL,  -- Display order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default Vietnamese grade components
INSERT INTO grade_component_configs (component_type, name_vi, name_en, weight, order_index) VALUES
  ('oral', 'Điểm miệng', 'Oral Score', 1, 1),
  ('fifteen_min', 'Điểm 15 phút', '15-minute Test', 1, 2),
  ('one_period', 'Điểm 1 tiết', '45-minute Test', 2, 3),
  ('midterm', 'Điểm giữa kỳ', 'Midterm Exam', 2, 4),
  ('final', 'Điểm cuối kỳ', 'Final Exam', 3, 5);

-- Create conduct grades table
CREATE TABLE IF NOT EXISTS conduct_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semester VARCHAR(10) NOT NULL, -- HK1, HK2
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  conduct_grade conduct_type NOT NULL,
  teacher_comment TEXT,
  evaluated_by UUID REFERENCES profiles(id),
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, semester, academic_year_id)
);

-- Add Vietnamese-specific fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code VARCHAR(20) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_level VARCHAR(10); -- Lớp 6, 7, 8, 9, 10, 11, 12

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_grades_component_semester ON grades(component_type, semester, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_conduct_student_semester ON conduct_grades(student_id, semester, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code) WHERE student_code IS NOT NULL;

-- Function to calculate weighted semester average
CREATE OR REPLACE FUNCTION calculate_semester_average(
  p_student_id UUID,
  p_subject_code VARCHAR,
  p_semester VARCHAR,
  p_academic_year_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  total_weighted_score NUMERIC := 0;
  total_weight NUMERIC := 0;
  grade_record RECORD;
BEGIN
  -- Get all grades for the student in this subject/semester
  FOR grade_record IN
    SELECT g.grade_value, gc.weight
    FROM grades g
    JOIN assignments a ON g.assignment_id = a.id
    JOIN grade_categories cat ON a.category_id = cat.id
    LEFT JOIN grade_component_configs gc ON g.component_type = gc.component_type
    WHERE g.student_id = p_student_id
      AND cat.code = p_subject_code
      AND g.semester = p_semester
      AND g.academic_year_id = p_academic_year_id
      AND g.grade_value IS NOT NULL
  LOOP
    total_weighted_score := total_weighted_score + (grade_record.grade_value * COALESCE(grade_record.weight, 1));
    total_weight := total_weight + COALESCE(grade_record.weight, 1);
  END LOOP;

  IF total_weight > 0 THEN
    RETURN ROUND(total_weighted_score / total_weight, 2);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get grade classification
CREATE OR REPLACE FUNCTION get_grade_classification(grade NUMERIC)
RETURNS VARCHAR AS $$
BEGIN
  IF grade >= 8 THEN
    RETURN 'Giỏi';
  ELSIF grade >= 6.5 THEN
    RETURN 'Khá';
  ELSIF grade >= 5 THEN
    RETURN 'Trung bình';
  ELSE
    RETURN 'Yếu';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE conduct_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can view conduct grades"
  ON conduct_grades FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'teacher')
    )
    OR student_id = auth.uid()
  );

CREATE POLICY "Teachers and admins can insert conduct grades"
  ON conduct_grades FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can update conduct grades"
  ON conduct_grades FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'teacher')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE grade_component_configs IS 'Configuration for Vietnamese grade component types with weights';
COMMENT ON TABLE conduct_grades IS 'Student conduct/behavior grades per semester (Hạnh kiểm)';
COMMENT ON FUNCTION calculate_semester_average IS 'Calculates weighted average based on Vietnamese grading system';
COMMENT ON FUNCTION get_grade_classification IS 'Returns Vietnamese grade classification (Giỏi/Khá/TB/Yếu)';
