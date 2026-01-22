-- Migration: Final RPC Fix
-- Purpose: Drop and recreate get_class_attendance to ensure no legacy column references (like checked_in_at) remain.

-- 1. Drop the function if it exists (with specific signature to be safe)
DROP FUNCTION IF EXISTS public.get_class_attendance(UUID, DATE) CASCADE;

-- 2. Recreate the function with the standardized schema
CREATE OR REPLACE FUNCTION public.get_class_attendance(p_class_id UUID, p_date DATE)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    student_code TEXT,
    email TEXT,
    status TEXT,
    remarks TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.student_id,
        p.full_name AS student_name,
        p.student_id AS student_code,
        p.email,
        COALESCE(a.status::TEXT, 'unmarked') AS status,
        COALESCE(a.remarks, '') AS remarks
    FROM 
        enrollments e
    JOIN 
        profiles p ON e.student_id = p.id
    LEFT JOIN 
        attendance a ON (e.student_id = a.student_id AND a.class_id = p_class_id AND a.date = p_date)
    WHERE 
        e.class_id = p_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verify success
SELECT 'Attendance RPC final fix migration completed' AS status;
