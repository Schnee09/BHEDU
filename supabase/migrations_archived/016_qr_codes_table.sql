-- Migration: QR Code Check-in System
-- Description: Create table for QR code based attendance check-in
-- Date: 2025-11-14

-- Drop table if exists (for idempotency)
DROP TABLE IF EXISTS qr_codes CASCADE;

-- Create qr_codes table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(255) UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  valid_date DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  check_in_location VARCHAR(255),
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_student ON qr_codes(student_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_valid_date ON qr_codes(valid_date);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_used_at ON qr_codes(used_at);

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage QR codes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Teachers can manage QR codes for their classes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own QR codes"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Function to generate QR code
CREATE OR REPLACE FUNCTION generate_qr_code(
  p_student_id UUID,
  p_class_id UUID,
  p_valid_date DATE,
  p_expiry_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  qr_code_id UUID,
  code VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_code VARCHAR;
  v_expires_at TIMESTAMPTZ;
  v_qr_id UUID;
BEGIN
  -- Generate unique code using UUID and hash
  v_code := encode(
    digest(gen_random_uuid()::text || p_student_id::text || NOW()::text, 'sha256'),
    'base64'
  );
  
  -- Calculate expiry time
  v_expires_at := NOW() + (p_expiry_hours || ' hours')::INTERVAL;
  
  -- Insert QR code
  INSERT INTO qr_codes (student_id, code, class_id, valid_date, expires_at)
  VALUES (p_student_id, v_code, p_class_id, p_valid_date, v_expires_at)
  RETURNING id INTO v_qr_id;
  
  RETURN QUERY
  SELECT v_qr_id, v_code, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use QR code
CREATE OR REPLACE FUNCTION check_in_with_qr(
  p_code VARCHAR,
  p_location VARCHAR DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  student_id UUID,
  student_name TEXT,
  class_id UUID,
  attendance_id UUID
) AS $$
DECLARE
  v_qr_record RECORD;
  v_attendance_id UUID;
  v_student_name TEXT;
BEGIN
  -- Find QR code
  SELECT * INTO v_qr_record
  FROM qr_codes
  WHERE code = p_code
  FOR UPDATE;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid QR code'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_qr_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'QR code already used'::TEXT, v_qr_record.student_id, NULL::TEXT, v_qr_record.class_id, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_qr_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'QR code expired'::TEXT, v_qr_record.student_id, NULL::TEXT, v_qr_record.class_id, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if valid for today
  IF v_qr_record.valid_date != CURRENT_DATE THEN
    RETURN QUERY SELECT false, 'QR code not valid for today'::TEXT, v_qr_record.student_id, NULL::TEXT, v_qr_record.class_id, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get student name
  SELECT first_name || ' ' || last_name INTO v_student_name
  FROM profiles
  WHERE id = v_qr_record.student_id;
  
  -- Mark QR code as used
  UPDATE qr_codes
  SET 
    used_at = NOW(),
    check_in_location = p_location,
    device_info = p_device_info
  WHERE code = p_code;
  
  -- Create or update attendance record
  INSERT INTO attendance (student_id, class_id, date, status, check_in_time)
  VALUES (
    v_qr_record.student_id,
    v_qr_record.class_id,
    CURRENT_DATE,
    'present',
    CURRENT_TIME
  )
  ON CONFLICT (student_id, class_id, date)
  DO UPDATE SET
    status = 'present',
    check_in_time = CURRENT_TIME,
    updated_at = NOW()
  RETURNING id INTO v_attendance_id;
  
  RETURN QUERY SELECT 
    true, 
    'Check-in successful'::TEXT, 
    v_qr_record.student_id, 
    v_student_name,
    v_qr_record.class_id, 
    v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired QR codes (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM qr_codes
  WHERE expires_at < NOW() - INTERVAL '7 days'
  AND used_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE qr_codes IS 'QR codes for student attendance check-in';
COMMENT ON COLUMN qr_codes.code IS 'Unique QR code string (base64 encoded hash)';
COMMENT ON COLUMN qr_codes.valid_date IS 'Date when this QR code is valid for check-in';
COMMENT ON COLUMN qr_codes.expires_at IS 'Timestamp when QR code expires';
COMMENT ON COLUMN qr_codes.used_at IS 'Timestamp when QR code was used for check-in';
COMMENT ON COLUMN qr_codes.check_in_location IS 'Location where student checked in (GPS, building, etc.)';
COMMENT ON FUNCTION generate_qr_code IS 'Generate a new QR code for student attendance';
COMMENT ON FUNCTION check_in_with_qr IS 'Validate QR code and mark attendance';
COMMENT ON FUNCTION cleanup_expired_qr_codes IS 'Remove old expired unused QR codes';
