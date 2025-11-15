-- Migration 021: School Settings and Configuration
-- Centralized configuration for school-wide settings

-- School settings table
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
  category VARCHAR(50) NOT NULL, -- general, academic, attendance, grading, financial
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Can non-admins see this setting?
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Academic years/terms table
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- e.g., "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  terms JSONB DEFAULT '[]'::jsonb, -- Array of terms: [{name, start_date, end_date}]
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Grading scales table
CREATE TABLE IF NOT EXISTS grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  scale JSONB NOT NULL, -- [{letter: 'A', min: 90, max: 100, gpa: 4.0}, ...]
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance policies table
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(100) NOT NULL,
  policy_type VARCHAR(50) NOT NULL, -- tardy_threshold, absence_notification, etc.
  policy_value JSONB NOT NULL, -- Configuration specific to policy type
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default school settings
INSERT INTO school_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('school_name', 'Bethel Heights Educational Development', 'string', 'general', 'Official school name', true),
('school_short_name', 'BH-EDU', 'string', 'general', 'School abbreviation', true),
('school_address', '', 'string', 'general', 'Physical address', false),
('school_phone', '', 'string', 'general', 'Contact phone number', true),
('school_email', '', 'string', 'general', 'Contact email address', true),
('school_website', '', 'string', 'general', 'School website URL', true),
('school_logo_url', '', 'string', 'general', 'URL to school logo', true),
('academic_year_start_month', '9', 'number', 'academic', 'Month when academic year starts (1-12)', false),
('default_class_duration', '50', 'number', 'academic', 'Default class duration in minutes', false),
('attendance_grace_period', '10', 'number', 'attendance', 'Minutes of grace period before marked tardy', false),
('attendance_notification_threshold', '3', 'number', 'attendance', 'Number of absences before notification', false),
('grading_scale_type', 'letter', 'string', 'grading', 'Default grading scale type (letter, percentage, points)', false),
('passing_grade', '60', 'number', 'grading', 'Minimum passing grade percentage', false),
('enable_late_submission', 'true', 'boolean', 'grading', 'Allow students to submit assignments late', false),
('late_penalty_percentage', '10', 'number', 'grading', 'Percentage deducted per day late', false),
('currency_symbol', '$', 'string', 'financial', 'Currency symbol for financial transactions', false),
('fiscal_year_start_month', '1', 'number', 'financial', 'Month when fiscal year starts (1-12)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default grading scale
INSERT INTO grading_scales (name, description, scale, is_default) VALUES
('Standard US Letter Grade', 'Traditional A-F grading scale', 
 '[
   {"letter": "A+", "min": 97, "max": 100, "gpa": 4.0, "description": "Outstanding"},
   {"letter": "A", "min": 93, "max": 96, "gpa": 4.0, "description": "Excellent"},
   {"letter": "A-", "min": 90, "max": 92, "gpa": 3.7, "description": "Very Good"},
   {"letter": "B+", "min": 87, "max": 89, "gpa": 3.3, "description": "Good"},
   {"letter": "B", "min": 83, "max": 86, "gpa": 3.0, "description": "Above Average"},
   {"letter": "B-", "min": 80, "max": 82, "gpa": 2.7, "description": "Average"},
   {"letter": "C+", "min": 77, "max": 79, "gpa": 2.3, "description": "Satisfactory"},
   {"letter": "C", "min": 73, "max": 76, "gpa": 2.0, "description": "Below Average"},
   {"letter": "C-", "min": 70, "max": 72, "gpa": 1.7, "description": "Poor"},
   {"letter": "D", "min": 60, "max": 69, "gpa": 1.0, "description": "Failing"},
   {"letter": "F", "min": 0, "max": 59, "gpa": 0.0, "description": "Fail"}
 ]'::jsonb,
 true
)
ON CONFLICT DO NOTHING;

-- Insert current academic year
INSERT INTO academic_years (name, start_date, end_date, is_current, terms) VALUES
('2024-2025', '2024-09-01', '2025-06-30', true, 
 '[
   {"name": "Fall Semester", "start_date": "2024-09-01", "end_date": "2024-12-20"},
   {"name": "Spring Semester", "start_date": "2025-01-07", "end_date": "2025-06-30"}
 ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert default attendance policies
INSERT INTO attendance_policies (policy_name, policy_type, policy_value, is_active) VALUES
('Tardy Threshold', 'tardy_threshold', '{"minutes": 10, "after_bell": true}'::jsonb, true),
('Absence Notification', 'absence_notification', '{"threshold": 3, "notify_guardian": true}'::jsonb, true),
('Excused Absence Allowed', 'excused_absence', '{"requires_documentation": true, "max_per_term": 10}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_settings_category ON school_settings(category);
CREATE INDEX IF NOT EXISTS idx_school_settings_key ON school_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_academic_years_current ON academic_years(is_current);
CREATE INDEX IF NOT EXISTS idx_academic_years_dates ON academic_years(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_grading_scales_default ON grading_scales(is_default);
CREATE INDEX IF NOT EXISTS idx_attendance_policies_active ON attendance_policies(is_active);

-- RLS Policies for school_settings
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read public settings
CREATE POLICY "Anyone can read public settings"
ON school_settings
FOR SELECT
TO authenticated
USING (is_public = true);

-- Admins can read all settings
CREATE POLICY "Admins can read all settings"
ON school_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings"
ON school_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for academic_years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Everyone can read academic years
CREATE POLICY "Anyone can read academic years"
ON academic_years
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify academic years
CREATE POLICY "Admins can modify academic years"
ON academic_years
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for grading_scales
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;

-- Everyone can read grading scales
CREATE POLICY "Anyone can read grading scales"
ON grading_scales
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify grading scales
CREATE POLICY "Admins can modify grading scales"
ON grading_scales
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for attendance_policies
ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;

-- Teachers and admins can read attendance policies
CREATE POLICY "Teachers and admins can read attendance policies"
ON attendance_policies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Only admins can modify attendance policies
CREATE POLICY "Admins can modify attendance policies"
ON attendance_policies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(p_key VARCHAR(100))
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT setting_value
  FROM school_settings
  WHERE setting_key = p_key;
$$;

-- Function to set setting value (admin only)
CREATE OR REPLACE FUNCTION set_setting(
  p_key VARCHAR(100),
  p_value TEXT,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM profiles
  WHERE id = p_updated_by;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can modify settings';
  END IF;
  
  UPDATE school_settings
  SET 
    setting_value = p_value,
    updated_by = p_updated_by,
    updated_at = now()
  WHERE setting_key = p_key;
  
  RETURN FOUND;
END;
$$;

-- Function to get current academic year
CREATE OR REPLACE FUNCTION get_current_academic_year()
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  start_date DATE,
  end_date DATE,
  terms JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, name, start_date, end_date, terms
  FROM academic_years
  WHERE is_current = true
  LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_setting TO authenticated;
GRANT EXECUTE ON FUNCTION set_setting TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_academic_year TO authenticated;

-- Comment on tables
COMMENT ON TABLE school_settings IS 'Centralized configuration for school-wide settings';
COMMENT ON TABLE academic_years IS 'Academic year and term definitions';
COMMENT ON TABLE grading_scales IS 'Letter grade to percentage mappings';
COMMENT ON TABLE attendance_policies IS 'Configurable attendance rules and thresholds';
