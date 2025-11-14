-- Assignment Categories Table
-- Stores different types of assignments (Homework, Quiz, Test, Project, etc.)

CREATE TABLE IF NOT EXISTS assignment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage weight (0-100)
  drop_lowest INT DEFAULT 0, -- Number of lowest grades to drop
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure weight is between 0 and 100
  CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100),
  CONSTRAINT valid_drop_lowest CHECK (drop_lowest >= 0),
  
  -- Unique category name per class
  UNIQUE(class_id, name)
);

-- Enable RLS
ALTER TABLE assignment_categories ENABLE ROW LEVEL SECURITY;

-- Policies for assignment_categories
-- Teachers can manage categories for their classes
CREATE POLICY assignment_categories_teacher_all ON assignment_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignment_categories.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view categories for their enrolled classes
CREATE POLICY assignment_categories_student_read ON assignment_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = assignment_categories.class_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Admins can view and manage all categories
CREATE POLICY assignment_categories_admin_all ON assignment_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_assignment_categories_class_id ON assignment_categories(class_id);

-- Comments
COMMENT ON TABLE assignment_categories IS 'Stores assignment categories/types with weights for grade calculation';
COMMENT ON COLUMN assignment_categories.weight IS 'Percentage weight of this category in final grade (0-100)';
COMMENT ON COLUMN assignment_categories.drop_lowest IS 'Number of lowest grades to drop from this category';
