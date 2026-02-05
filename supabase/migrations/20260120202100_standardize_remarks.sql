-- Rename notes to remarks if it exists and remarks doesn't
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'notes') AND
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'remarks') THEN
    ALTER TABLE attendance RENAME COLUMN notes TO remarks;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'remarks') THEN
    ALTER TABLE attendance ADD COLUMN remarks TEXT;
  END IF;
END $$;

-- Ensure the RPC uses the correct column
DROP FUNCTION IF EXISTS get_class_attendance(p_class_id UUID, p_date DATE);

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
        p.id as student_id,
        p.full_name as student_name,
        p.student_id as student_code,
        p.email,
        COALESCE(a.status, 'unmarked') as status,
        COALESCE(a.remarks, '') as remarks
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    LEFT JOIN attendance a ON p.id = a.student_id 
        AND a.class_id = p_class_id 
        AND a.date = p_date
    WHERE e.class_id = p_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
