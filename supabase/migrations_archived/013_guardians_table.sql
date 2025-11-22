-- Migration: Guardians/Parents Table
-- Description: Create table to store parent and guardian information
-- Date: 2025-11-14

-- Drop table if exists (for idempotency)
DROP TABLE IF EXISTS guardians CASCADE;

-- Create guardians table
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(50), -- father, mother, guardian, grandparent, etc.
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  is_emergency_contact BOOLEAN DEFAULT false,
  occupation VARCHAR(100),
  workplace VARCHAR(255),
  work_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_guardians_student_id ON guardians(student_id);
CREATE INDEX idx_guardians_email ON guardians(email);
CREATE INDEX idx_guardians_phone ON guardians(phone);
CREATE INDEX idx_guardians_is_primary ON guardians(is_primary_contact) WHERE is_primary_contact = true;

-- Add check constraint for relationship
ALTER TABLE guardians 
  ADD CONSTRAINT guardians_relationship_check 
  CHECK (relationship IN ('father', 'mother', 'guardian', 'grandparent', 'sibling', 'other'));

-- Enable RLS
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can manage guardians"
  ON guardians
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teachers can view guardians of their students
CREATE POLICY "Teachers can view guardians of their students"
  ON guardians
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM enrollments
      JOIN classes ON enrollments.class_id = classes.id
      WHERE enrollments.student_id = guardians.student_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view their own guardians
CREATE POLICY "Students can view their own guardians"
  ON guardians
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_guardians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION update_guardians_updated_at();

COMMENT ON TABLE guardians IS 'Parent and guardian information for students';
COMMENT ON COLUMN guardians.student_id IS 'References the student (profiles.id)';
COMMENT ON COLUMN guardians.is_primary_contact IS 'Primary contact for school communications';
COMMENT ON COLUMN guardians.is_emergency_contact IS 'Emergency contact person';
