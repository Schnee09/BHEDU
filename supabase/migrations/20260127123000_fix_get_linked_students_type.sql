-- Migration: Fix get_linked_students return type mismatch
-- Created: 2026-01-27
-- Purpose: Explicitly cast columns to TEXT to match RETURNS TABLE definition

CREATE OR REPLACE FUNCTION get_linked_students(parent_profile_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_code TEXT,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psl.student_id,
    p.full_name::text AS student_name,
    sp.student_code::text,
    psl.relationship::text
  FROM parent_student_links psl
  JOIN profiles p ON psl.student_id = p.id
  LEFT JOIN student_profiles sp ON p.id = sp.profile_id
  WHERE psl.parent_id = parent_profile_id
    AND psl.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
