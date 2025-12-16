-- Migration 004: School Settings and Configuration
-- Centralized configuration for school-wide settings

-- School settings table
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) NOT NULL DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default school settings (without category field for simplicity)
INSERT INTO school_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('school_name', 'Bethel Heights Educational Development', 'string', 'Official school name', true),
('school_short_name', 'BH-EDU', 'string', 'School abbreviation', true),
('school_address', '', 'string', 'Physical address', false),
('school_phone', '', 'string', 'Contact phone number', true),
('school_email', '', 'string', 'Contact email address', true),
('school_website', '', 'string', 'School website URL', true),
('school_logo_url', '', 'string', 'URL to school logo', true),
('academic_year_start_month', '9', 'number', 'Month when academic year starts (1-12)', false),
('default_class_duration', '50', 'number', 'Default class duration in minutes', false),
('attendance_grace_period', '10', 'number', 'Minutes of grace period before marked tardy', false),
('attendance_notification_threshold', '3', 'number', 'Number of absences before notification', false),
('grading_scale_type', 'letter', 'string', 'Default grading scale type', false),
('passing_grade', '60', 'number', 'Minimum passing grade percentage', false),
('enable_late_submission', 'true', 'boolean', 'Allow students to submit assignments late', false),
('late_penalty_percentage', '10', 'number', 'Percentage deducted per day late', false),
('currency_symbol', '$', 'string', 'Currency symbol for financial transactions', false),
('fiscal_year_start_month', '1', 'number', 'Month when fiscal year starts (1-12)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_settings_key ON school_settings(setting_key);

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_setting TO authenticated;
