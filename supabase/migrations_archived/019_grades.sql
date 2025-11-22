-- Grades Table
-- Stores individual student grades for assignments

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_earned DECIMAL(10,2),
  late BOOLEAN DEFAULT false,
  excused BOOLEAN DEFAULT false,
  missing BOOLEAN DEFAULT false,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure points_earned is non-negative and doesn't exceed total_points
  CONSTRAINT valid_points_earned CHECK (points_earned IS NULL OR points_earned >= 0),
  
  -- One grade per student per assignment
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Policies for grades
-- Teachers can manage grades for assignments in their classes
CREATE POLICY grades_teacher_all ON grades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN classes ON classes.id = assignments.class_id
      WHERE assignments.id = grades.assignment_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view their own grades
CREATE POLICY grades_student_read ON grades
  FOR SELECT
  USING (
    grades.student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = grades.assignment_id
      AND assignments.published = true
    )
  );

-- Admins can view and manage all grades
CREATE POLICY grades_admin_all ON grades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_graded_by ON grades(graded_by);
CREATE INDEX idx_grades_missing ON grades(missing) WHERE missing = true;
CREATE INDEX idx_grades_late ON grades(late) WHERE late = true;

-- Function to calculate grade percentage
CREATE OR REPLACE FUNCTION calculate_grade_percentage(
  p_assignment_id UUID,
  p_student_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_points_earned DECIMAL(10,2);
  v_total_points DECIMAL(10,2);
  v_excused BOOLEAN;
  v_missing BOOLEAN;
BEGIN
  -- Get grade info
  SELECT points_earned, excused, missing
  INTO v_points_earned, v_excused, v_missing
  FROM grades
  WHERE assignment_id = p_assignment_id
  AND student_id = p_student_id;
  
  -- If no grade record, return NULL
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- If excused, return NULL (doesn't count)
  IF v_excused THEN
    RETURN NULL;
  END IF;
  
  -- If missing and no points, return 0
  IF v_missing AND v_points_earned IS NULL THEN
    RETURN 0.00;
  END IF;
  
  -- If points not entered yet, return NULL
  IF v_points_earned IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get total points
  SELECT total_points
  INTO v_total_points
  FROM assignments
  WHERE id = p_assignment_id;
  
  -- Calculate percentage
  IF v_total_points > 0 THEN
    RETURN ROUND((v_points_earned / v_total_points) * 100, 2);
  ELSE
    RETURN 0.00;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate category average
CREATE OR REPLACE FUNCTION calculate_category_average(
  p_class_id UUID,
  p_student_id UUID,
  p_category_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_points DECIMAL(10,2) := 0;
  v_earned_points DECIMAL(10,2) := 0;
  v_drop_lowest INT;
  v_grade RECORD;
  v_percentages DECIMAL(5,2)[];
BEGIN
  -- Get drop_lowest setting
  SELECT drop_lowest INTO v_drop_lowest
  FROM assignment_categories
  WHERE id = p_category_id;
  
  -- Get all graded assignments in this category
  FOR v_grade IN
    SELECT 
      g.points_earned,
      a.total_points,
      g.excused,
      g.missing
    FROM grades g
    JOIN assignments a ON a.id = g.assignment_id
    WHERE a.class_id = p_class_id
    AND a.category_id = p_category_id
    AND g.student_id = p_student_id
    AND a.published = true
    AND NOT g.excused
    ORDER BY (g.points_earned / NULLIF(a.total_points, 0)) ASC
  LOOP
    -- Handle missing assignments
    IF v_grade.missing AND v_grade.points_earned IS NULL THEN
      v_percentages := array_append(v_percentages, 0.00);
    ELSIF v_grade.points_earned IS NOT NULL THEN
      v_percentages := array_append(v_percentages, 
        ROUND((v_grade.points_earned / NULLIF(v_grade.total_points, 0)) * 100, 2));
    END IF;
  END LOOP;
  
  -- If no grades, return NULL
  IF array_length(v_percentages, 1) IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Drop lowest grades if configured
  IF v_drop_lowest > 0 AND array_length(v_percentages, 1) > v_drop_lowest THEN
    -- Remove the lowest N grades
    FOR i IN 1..LEAST(v_drop_lowest, array_length(v_percentages, 1) - 1) LOOP
      v_percentages := v_percentages[2:array_length(v_percentages, 1)];
    END LOOP;
  END IF;
  
  -- Calculate average
  IF array_length(v_percentages, 1) > 0 THEN
    RETURN ROUND(
      (SELECT AVG(unnest) FROM unnest(v_percentages)),
      2
    );
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate overall grade
CREATE OR REPLACE FUNCTION calculate_overall_grade(
  p_class_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  overall_percentage DECIMAL(5,2),
  letter_grade VARCHAR(2),
  category_grades JSONB
) AS $$
DECLARE
  v_weighted_sum DECIMAL(10,4) := 0;
  v_total_weight DECIMAL(10,4) := 0;
  v_category RECORD;
  v_cat_average DECIMAL(5,2);
  v_cat_grades JSONB := '[]'::jsonb;
BEGIN
  -- Calculate weighted average across all categories
  FOR v_category IN
    SELECT id, name, weight
    FROM assignment_categories
    WHERE class_id = p_class_id
    AND weight > 0
  LOOP
    -- Get category average
    v_cat_average := calculate_category_average(p_class_id, p_student_id, v_category.id);
    
    IF v_cat_average IS NOT NULL THEN
      v_weighted_sum := v_weighted_sum + (v_cat_average * v_category.weight / 100.0);
      v_total_weight := v_total_weight + v_category.weight;
      
      v_cat_grades := v_cat_grades || jsonb_build_object(
        'category_id', v_category.id,
        'category_name', v_category.name,
        'average', v_cat_average,
        'weight', v_category.weight
      );
    END IF;
  END LOOP;
  
  -- Calculate final percentage
  IF v_total_weight > 0 THEN
    overall_percentage := ROUND((v_weighted_sum / v_total_weight) * 100, 2);
  ELSE
    overall_percentage := NULL;
  END IF;
  
  -- Calculate letter grade (standard scale)
  IF overall_percentage IS NOT NULL THEN
    CASE
      WHEN overall_percentage >= 93 THEN letter_grade := 'A';
      WHEN overall_percentage >= 90 THEN letter_grade := 'A-';
      WHEN overall_percentage >= 87 THEN letter_grade := 'B+';
      WHEN overall_percentage >= 83 THEN letter_grade := 'B';
      WHEN overall_percentage >= 80 THEN letter_grade := 'B-';
      WHEN overall_percentage >= 77 THEN letter_grade := 'C+';
      WHEN overall_percentage >= 73 THEN letter_grade := 'C';
      WHEN overall_percentage >= 70 THEN letter_grade := 'C-';
      WHEN overall_percentage >= 67 THEN letter_grade := 'D+';
      WHEN overall_percentage >= 63 THEN letter_grade := 'D';
      WHEN overall_percentage >= 60 THEN letter_grade := 'D-';
      ELSE letter_grade := 'F';
    END CASE;
  END IF;
  
  category_grades := v_cat_grades;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments
COMMENT ON TABLE grades IS 'Stores student grades for assignments';
COMMENT ON COLUMN grades.points_earned IS 'Points earned by student (NULL if not graded yet)';
COMMENT ON COLUMN grades.late IS 'Whether the assignment was submitted late';
COMMENT ON COLUMN grades.excused IS 'Whether the student is excused from this assignment';
COMMENT ON COLUMN grades.missing IS 'Whether the assignment is missing/not submitted';
