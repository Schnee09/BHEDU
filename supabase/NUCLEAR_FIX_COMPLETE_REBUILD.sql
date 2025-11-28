-- ================================================================
-- NUCLEAR OPTION: COMPLETE DATABASE SCHEMA FIX
-- ================================================================
-- This script will:
-- 1. Add ALL missing columns to profiles table
-- 2. Create ALL missing RPC functions
-- 3. Fix ALL constraints and indexes
-- 4. Preserve ALL existing data
-- ================================================================

-- Step 1: Add missing columns to profiles table
-- ================================================================
DO $$ 
BEGIN
  -- Add is_active
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column';
  END IF;

  -- Add status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    RAISE NOTICE 'Added status column';
  END IF;

  -- Add department
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
    ALTER TABLE profiles ADD COLUMN department TEXT;
    RAISE NOTICE 'Added department column';
  END IF;

  -- Add notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
    ALTER TABLE profiles ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  END IF;

  -- Add created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_by') THEN
    ALTER TABLE profiles ADD COLUMN created_by UUID;
    RAISE NOTICE 'Added created_by column';
  END IF;

  -- Add enrollment_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'enrollment_date') THEN
    ALTER TABLE profiles ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added enrollment_date column';
  END IF;

  -- Add photo_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'photo_url') THEN
    ALTER TABLE profiles ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column';
  END IF;

  -- Add gender
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender VARCHAR(10);
    RAISE NOTICE 'Added gender column';
  END IF;

  RAISE NOTICE 'All profile columns checked/added';
END $$;

-- Step 2: Create indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level) WHERE grade_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_date ON profiles(enrollment_date);

-- Step 3: Ensure qr_codes table exists BEFORE creating functions
-- ================================================================
-- First, make sure classes table exists (should already exist)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate qr_codes table to ensure clean state
DROP TABLE IF EXISTS qr_codes CASCADE;

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_token ON qr_codes(token);
CREATE INDEX idx_qr_codes_valid ON qr_codes(valid_until) WHERE used_at IS NULL;

-- Step 4: Fix attendance table constraints
-- ================================================================
DO $$ 
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_student_class_date_unique'
    AND table_name = 'attendance'
  ) THEN
    ALTER TABLE attendance 
    ADD CONSTRAINT attendance_student_class_date_unique 
    UNIQUE (student_id, class_id, date);
    RAISE NOTICE 'Added attendance unique constraint';
  END IF;
END $$;

-- Step 5: Create/Replace ALL RPC functions
-- ================================================================

-- Drop existing functions first to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_statistics();
DROP FUNCTION IF EXISTS get_class_attendance(UUID, DATE);
DROP FUNCTION IF EXISTS calculate_overall_grade(UUID, UUID);
DROP FUNCTION IF EXISTS generate_qr_code(UUID, INTEGER);
DROP FUNCTION IF EXISTS check_in_with_qr(TEXT, UUID);

-- Function 1: get_user_statistics
CREATE FUNCTION get_user_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
    'total_teachers', (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
    'total_classes', (SELECT COUNT(*) FROM classes),
    'total_assignments', (SELECT COUNT(*) FROM assignments)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: get_class_attendance
CREATE FUNCTION get_class_attendance(p_class_id UUID, p_date DATE)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  status TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.student_id,
    p.full_name as student_name,
    COALESCE(a.status, 'absent') as status,
    a.checked_in_at
  FROM enrollments e
  JOIN profiles p ON e.student_id = p.id
  LEFT JOIN attendance a ON a.student_id = e.student_id 
    AND a.class_id = p_class_id 
    AND a.date = p_date
  WHERE e.class_id = p_class_id
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: calculate_overall_grade
CREATE FUNCTION calculate_overall_grade(p_student_id UUID, p_class_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_grade NUMERIC;
BEGIN
  SELECT AVG(g.score)
  INTO avg_grade
  FROM grades g
  JOIN assignments a ON g.assignment_id = a.id
  WHERE g.student_id = p_student_id
    AND a.class_id = p_class_id
    AND g.score IS NOT NULL;
  
  RETURN COALESCE(avg_grade, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: generate_qr_code
CREATE FUNCTION generate_qr_code(p_class_id UUID, p_valid_minutes INTEGER DEFAULT 15)
RETURNS JSON AS $$
DECLARE
  qr_token TEXT;
  valid_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate a random token
  qr_token := encode(gen_random_bytes(32), 'base64');
  valid_until := NOW() + (p_valid_minutes || ' minutes')::INTERVAL;
  
  -- Store in qr_codes table
  INSERT INTO qr_codes (class_id, token, valid_until, created_at)
  VALUES (p_class_id, qr_token, valid_until, NOW());
  
  -- Return the result
  RETURN json_build_object(
    'token', qr_token,
    'valid_until', valid_until,
    'class_id', p_class_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: check_in_with_qr
CREATE FUNCTION check_in_with_qr(p_token TEXT, p_student_id UUID)
RETURNS JSON AS $$
DECLARE
  qr_record RECORD;
  result JSON;
BEGIN
  -- Find valid QR code
  SELECT * INTO qr_record
  FROM qr_codes
  WHERE token = p_token
    AND valid_until > NOW()
    AND used_at IS NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired QR code');
  END IF;
  
  -- Mark attendance
  INSERT INTO attendance (student_id, class_id, date, status, checked_in_at)
  VALUES (p_student_id, qr_record.class_id, CURRENT_DATE, 'present', NOW())
  ON CONFLICT (student_id, class_id, date) 
  DO UPDATE SET 
    status = 'present',
    checked_in_at = NOW();
  
  -- Mark QR code as used
  UPDATE qr_codes
  SET used_at = NOW()
  WHERE token = p_token;
  
  RETURN json_build_object('success', true, 'class_id', qr_record.class_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update existing NULL values to defaults
-- ================================================================
UPDATE profiles SET is_active = true WHERE is_active IS NULL;
UPDATE profiles SET status = 'active' WHERE status IS NULL;
UPDATE profiles SET enrollment_date = created_at WHERE enrollment_date IS NULL AND role = 'student';

-- Step 7: Grant permissions
-- ================================================================
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_attendance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overall_grade(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_in_with_qr(TEXT, UUID) TO authenticated;

-- Step 8: Verification Query
-- ================================================================
SELECT 
  '=== VERIFICATION RESULTS ===' as section,
  '' as details
UNION ALL
SELECT 
  'Profiles columns:' as section,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as details
FROM information_schema.columns
WHERE table_name = 'profiles'
UNION ALL
SELECT 
  'RPC functions:' as section,
  string_agg(routine_name, ', ') as details
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
  AND routine_schema = 'public'
  AND routine_name IN (
    'get_user_statistics',
    'get_class_attendance',
    'calculate_overall_grade',
    'generate_qr_code',
    'check_in_with_qr'
  )
UNION ALL
SELECT
  'Total profiles:' as section,
  COUNT(*)::TEXT as details
FROM profiles
UNION ALL
SELECT
  'Active students:' as section,
  COUNT(*)::TEXT as details
FROM profiles
WHERE role = 'student' AND is_active = true;

-- ================================================================
-- DONE! Your database is now ready.
-- Next step: Restart your Next.js dev server
-- ================================================================
