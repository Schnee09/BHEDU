-- Courses table migration
-- Creates the courses table for course/subject management

-- Create table if not exists
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_vi TEXT, -- Vietnamese name
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
  credits INTEGER DEFAULT 1,
  hours_per_week INTEGER DEFAULT 2,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'semester') THEN
    ALTER TABLE courses ADD COLUMN semester INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'academic_year_id') THEN
    ALTER TABLE courses ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_grade_level ON courses(grade_level);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Staff can manage courses" ON courses;

-- Policy: Anyone authenticated can view active courses
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  ));

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Staff can insert and update
CREATE POLICY "Staff can manage courses" ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'staff'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

-- Comment on table
COMMENT ON TABLE courses IS 'Stores course/curriculum information for the school';

-- NOTE: Sample courses removed — add real courses via the UI or seed.sql
