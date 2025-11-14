-- Migration: Import Logs Table
-- Description: Track bulk import operations for audit and troubleshooting
-- Date: 2025-11-14

-- Drop table if exists (for idempotency)
DROP TABLE IF EXISTS import_logs CASCADE;

-- Create import_logs table
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  import_type VARCHAR(50) NOT NULL, -- students, teachers, courses, etc.
  file_name VARCHAR(255),
  file_size INTEGER, -- in bytes
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  error_summary TEXT, -- JSON array of error messages
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import_errors table for detailed error tracking
DROP TABLE IF EXISTS import_errors CASCADE;

CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_log_id UUID NOT NULL REFERENCES import_logs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name VARCHAR(100),
  error_type VARCHAR(50), -- validation, duplicate, missing_required, invalid_format, etc.
  error_message TEXT NOT NULL,
  row_data JSONB, -- the problematic row data
  severity VARCHAR(20) DEFAULT 'error', -- error, warning
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_import_logs_imported_by ON import_logs(imported_by);
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_import_type ON import_logs(import_type);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at DESC);

CREATE INDEX idx_import_errors_import_log_id ON import_errors(import_log_id);
CREATE INDEX idx_import_errors_error_type ON import_errors(error_type);
CREATE INDEX idx_import_errors_severity ON import_errors(severity);

-- Add check constraints
ALTER TABLE import_logs 
  ADD CONSTRAINT import_logs_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE import_errors 
  ADD CONSTRAINT import_errors_severity_check 
  CHECK (severity IN ('error', 'warning', 'info'));

-- Enable RLS
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import_logs
CREATE POLICY "Admins can manage import logs"
  ON import_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own import logs"
  ON import_logs
  FOR SELECT
  TO authenticated
  USING (imported_by = auth.uid());

-- RLS Policies for import_errors
CREATE POLICY "Admins can view all import errors"
  ON import_errors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view errors from their imports"
  ON import_errors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM import_logs
      WHERE import_logs.id = import_errors.import_log_id
      AND import_logs.imported_by = auth.uid()
    )
  );

-- Function to calculate duration when import completes
CREATE OR REPLACE FUNCTION calculate_import_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status != NEW.status THEN
    NEW.completed_at = NOW();
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NOW() - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER import_logs_calculate_duration
  BEFORE UPDATE ON import_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_import_duration();

COMMENT ON TABLE import_logs IS 'Tracks bulk import operations for audit and monitoring';
COMMENT ON TABLE import_errors IS 'Detailed error information for failed import rows';
COMMENT ON COLUMN import_logs.error_summary IS 'JSON array summarizing common errors';
COMMENT ON COLUMN import_errors.row_data IS 'JSONB containing the problematic row data for debugging';
