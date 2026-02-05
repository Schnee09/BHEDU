-- Redefine get_class_attendance RPC to use correct schema and return consistent data
-- This function gets all students enrolled in a class and their attendance for a specific date

DROP FUNCTION IF EXISTS public.get_class_attendance(UUID, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_class_attendance(p_class_id UUID, p_date DATE)
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

-- Ensure RLS is enabled on attendance if not already
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read attendance
-- (Already handled by standard policies, but ensuring access here just in case)
DROP POLICY IF EXISTS "Anyone can read attendance" ON attendance;
CREATE POLICY "Anyone can read attendance" ON attendance
    FOR SELECT TO authenticated USING (true);

-- Policy: Teachers can update attendance for their classes
DROP POLICY IF EXISTS "Teachers can update attendance" ON attendance;
CREATE POLICY "Teachers can update attendance" ON attendance
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = attendance.class_id
            AND c.teacher_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff')
        )
    );
