-- Settings table migration
-- Creates a key-value settings table for school configuration

-- Create table if not exists
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE, -- Whether non-admins can view
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON settings;

-- Policy: Anyone authenticated can view public settings
CREATE POLICY "Anyone can view public settings" ON settings
  FOR SELECT
  USING (is_public = TRUE OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  ));

-- Policy: Only admins can manage settings
CREATE POLICY "Admins can manage all settings" ON settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Comment on table
COMMENT ON TABLE settings IS 'Key-value store for school configuration settings';

-- Insert default settings
INSERT INTO settings (key, value, description, category, is_public) VALUES
  ('school_name', 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG', 'Name of the school', 'school', TRUE),
  ('school_name_short', 'BH-EDU', 'Short name/abbreviation', 'school', TRUE),
  ('school_address', '', 'School address', 'school', TRUE),
  ('school_phone', '', 'School phone number', 'school', TRUE),
  ('school_email', '', 'School email address', 'school', TRUE),
  ('school_website', '', 'School website URL', 'school', TRUE),
  ('school_logo_url', '/logo.png', 'URL to school logo', 'school', TRUE),
  ('academic_year', '2025-2026', 'Current academic year', 'academic', TRUE),
  ('semester', '2', 'Current semester (1 or 2)', 'academic', TRUE),
  ('grading_scale', '10', 'Grading scale (10 or 100)', 'academic', TRUE),
  ('attendance_start_time', '07:00', 'Default attendance start time', 'attendance', FALSE),
  ('late_threshold_minutes', '15', 'Minutes after which student is marked late', 'attendance', FALSE)
ON CONFLICT (key) DO NOTHING;
