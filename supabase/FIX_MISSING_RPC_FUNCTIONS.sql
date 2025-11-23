-- Fix Missing RPC Functions
-- This script creates all the RPC functions that are being called by the API but don't exist in the database

-- First, add unique constraint to attendance table if it doesn't exist
DO $$ 
BEGIN
  -- Check if constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_student_class_date_unique'
    AND table_name = 'attendance'
  ) THEN
    EXECUTE 'ALTER TABLE attendance ADD CONSTRAINT attendance_student_class_date_unique UNIQUE (student_id, class_id, date)';
  END IF;
END $$;

-- 1. get_user_statistics function
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', COUNT(*),
    'active_users', COUNT(*) FILTER (WHERE is_active = true),
    'students', COUNT(*) FILTER (WHERE role = 'student'),
    'teachers', COUNT(*) FILTER (WHERE role = 'teacher'),
    'admins', COUNT(*) FILTER (WHERE role = 'admin'),
    'parents', COUNT(*) FILTER (WHERE role = 'parent')
  )
  INTO result
  FROM profiles;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;

-- 2. get_class_attendance function
CREATE OR REPLACE FUNCTION get_class_attendance(
  p_class_id uuid,
  p_date date
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  student_number text,
  status text,
  check_in_time time,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.student_id AS student_id,
    p.full_name AS student_name,
    COALESCE(p.student_id, '') AS student_number,
    COALESCE(att.status, 'absent'::text) AS status,
    att.check_in_time AS check_in_time,
    att.notes AS notes
  FROM enrollments e
  INNER JOIN profiles p ON p.id = e.student_id
  LEFT JOIN attendance att ON att.student_id = e.student_id 
    AND att.class_id = p_class_id 
    AND att.date = p_date
  WHERE e.class_id = p_class_id
  ORDER BY p.full_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_class_attendance TO authenticated;

-- 3. calculate_overall_grade function
CREATE OR REPLACE FUNCTION calculate_overall_grade(
  p_class_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_weighted_score numeric := 0;
  total_weight numeric := 0;
  category_data jsonb := '[]'::jsonb;
  cat record;
BEGIN
  -- Calculate grade for each category
  FOR cat IN 
    SELECT 
      ac.id as category_id,
      ac.name as category_name,
      ac.weight,
      AVG(CASE 
        WHEN a.total_points > 0 THEN (g.score / a.total_points) * 100 
        ELSE NULL 
      END) as avg_percentage
    FROM assignment_categories ac
    LEFT JOIN assignments a ON a.category_id = ac.id AND a.class_id = p_class_id
    LEFT JOIN grades g ON g.assignment_id = a.id AND g.student_id = p_student_id
    WHERE ac.class_id = p_class_id
    GROUP BY ac.id, ac.name, ac.weight
  LOOP
    IF cat.avg_percentage IS NOT NULL THEN
      total_weighted_score := total_weighted_score + (cat.avg_percentage * cat.weight);
      total_weight := total_weight + cat.weight;
      
      category_data := category_data || jsonb_build_object(
        'category_id', cat.category_id,
        'category_name', cat.category_name,
        'percentage', ROUND(cat.avg_percentage, 2),
        'letter_grade', 
          CASE 
            WHEN cat.avg_percentage >= 90 THEN 'A'
            WHEN cat.avg_percentage >= 80 THEN 'B'
            WHEN cat.avg_percentage >= 70 THEN 'C'
            WHEN cat.avg_percentage >= 60 THEN 'D'
            ELSE 'F'
          END
      );
    END IF;
  END LOOP;
  
  -- Calculate overall grade
  IF total_weight > 0 THEN
    result := jsonb_build_object(
      'overall_percentage', ROUND(total_weighted_score / total_weight, 2),
      'letter_grade', 
        CASE 
          WHEN (total_weighted_score / total_weight) >= 90 THEN 'A'
          WHEN (total_weighted_score / total_weight) >= 80 THEN 'B'
          WHEN (total_weighted_score / total_weight) >= 70 THEN 'C'
          WHEN (total_weighted_score / total_weight) >= 60 THEN 'D'
          ELSE 'F'
        END,
      'category_grades', category_data
    );
  ELSE
    result := jsonb_build_object(
      'overall_percentage', null,
      'letter_grade', null,
      'category_grades', '[]'::jsonb
    );
  END IF;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_overall_grade TO authenticated;

-- Create qr_codes table BEFORE functions that use it
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  date date NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create index on qr_codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_student_date ON qr_codes(student_id, date);

-- 4. generate_qr_code function
CREATE OR REPLACE FUNCTION generate_qr_code(
  p_student_id uuid,
  p_date date,
  p_expiry_hours integer DEFAULT 24
)
RETURNS TABLE (
  code text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_expires_at timestamptz;
BEGIN
  -- Generate a random code
  v_code := encode(gen_random_bytes(16), 'hex');
  v_expires_at := now() + (p_expiry_hours || ' hours')::interval;
  
  -- Insert or update the QR code
  INSERT INTO qr_codes (student_id, code, date, expires_at, used)
  VALUES (p_student_id, v_code, p_date, v_expires_at, false)
  ON CONFLICT (student_id, date) 
  DO UPDATE SET 
    code = v_code,
    expires_at = v_expires_at,
    used = false;
  
  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_qr_code TO authenticated;

-- 5. check_in_with_qr function
CREATE OR REPLACE FUNCTION check_in_with_qr(
  p_code text,
  p_class_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_date date;
  v_expires_at timestamptz;
  v_used boolean;
BEGIN
  -- Find the QR code
  SELECT student_id, date, expires_at, used
  INTO v_student_id, v_date, v_expires_at, v_used
  FROM qr_codes
  WHERE code = p_code
  LIMIT 1;
  
  -- Validate QR code
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
  END IF;
  
  IF v_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR code already used');
  END IF;
  
  IF v_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR code expired');
  END IF;
  
  -- Mark attendance
  INSERT INTO attendance (student_id, class_id, date, status, check_in_time)
  VALUES (v_student_id, p_class_id, v_date, 'present', CURRENT_TIME)
  ON CONFLICT (student_id, class_id, date)
  DO UPDATE SET 
    status = 'present', 
    check_in_time = CURRENT_TIME;
  
  -- Mark QR code as used
  UPDATE qr_codes SET used = true WHERE code = p_code;
  
  RETURN jsonb_build_object('success', true, 'student_id', v_student_id);
END;
$$;

GRANT EXECUTE ON FUNCTION check_in_with_qr TO authenticated;

-- Enable RLS on qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for qr_codes
CREATE POLICY "Users can view their own QR codes"
  ON qr_codes FOR SELECT
  USING (
    auth.uid() = student_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can create QR codes"
  ON qr_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "System can update QR codes"
  ON qr_codes FOR UPDATE
  USING (true);

COMMENT ON FUNCTION get_user_statistics IS 'Returns statistics about users by role';
COMMENT ON FUNCTION get_class_attendance IS 'Gets attendance records for a class on a specific date';
COMMENT ON FUNCTION calculate_overall_grade IS 'Calculates overall grade for a student in a class';
COMMENT ON FUNCTION generate_qr_code IS 'Generates a QR code for student attendance';
COMMENT ON FUNCTION check_in_with_qr IS 'Checks in a student using a QR code';
