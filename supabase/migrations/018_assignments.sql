-- Assignments Table Enhancement
-- Add new columns to existing assignments table for grade book

-- Add new columns
ALTER TABLE assignments 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES assignment_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_points DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraint for total_points (only if column was added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_total_points'
  ) THEN
    ALTER TABLE assignments 
    ADD CONSTRAINT valid_total_points CHECK (total_points IS NULL OR total_points > 0);
  END IF;
END $$;

-- Enable RLS (if not already enabled)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS assignments_teacher_all ON assignments;
DROP POLICY IF EXISTS assignments_student_read ON assignments;
DROP POLICY IF EXISTS assignments_admin_all ON assignments;

-- Policies for assignments
-- Teachers can manage assignments for their classes
CREATE POLICY assignments_teacher_all ON assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view published assignments for their enrolled classes
CREATE POLICY assignments_student_read ON assignments
  FOR SELECT
  USING (
    (published = true OR published IS NULL)
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = assignments.class_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Admins can view and manage all assignments
CREATE POLICY assignments_admin_all ON assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_category_id ON assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_published ON assignments(published);

-- Comments
COMMENT ON TABLE assignments IS 'Stores assignments/assessments for classes';
COMMENT ON COLUMN assignments.total_points IS 'Maximum points possible for this assignment';
COMMENT ON COLUMN assignments.published IS 'Whether students can see this assignment';
