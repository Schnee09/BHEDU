-- Fix get_class_averages: scope grades and attendance to the correct class
-- 
-- BUG: The original RPC joined grades/attendance on student_id only,
-- which pulled in data from ALL classes a student is in, not just
-- the class being aggregated. This caused inflated/incorrect GPAs,
-- pass rates, and attendance rates.

CREATE OR REPLACE FUNCTION get_class_averages()
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    teacher_name TEXT,
    student_count BIGINT,
    average_gpa NUMERIC,
    attendance_rate NUMERIC,
    pass_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH class_stats AS (
        SELECT 
            c.id AS c_id,
            c.name AS c_name,
            COALESCE(t.full_name, 'Chưa phân công') AS t_name,
            COUNT(DISTINCT e.student_id) AS s_count,
            COALESCE(AVG(g.score), 0) AS avg_gpa,
            -- Calculate pass rate (GPA >= 5.0)
            COALESCE(
                SUM(CASE WHEN g.score >= 5.0 THEN 1 ELSE 0 END)::numeric / 
                NULLIF(COUNT(g.score), 0) * 100, 
            0) AS p_rate,
            -- Attendance Rate (Present vs Total logs for class)
            COALESCE(
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / 
                NULLIF(COUNT(a.id), 0) * 100, 
            0) AS att_rate
        FROM classes c
        LEFT JOIN profiles t ON t.id = c.teacher_id
        LEFT JOIN enrollments e ON e.class_id = c.id
        -- FIX: scope grades to the current class (not all classes)
        LEFT JOIN grades g ON g.student_id = e.student_id AND g.class_id = c.id
        -- FIX: scope attendance to the current class
        LEFT JOIN attendance a ON a.student_id = e.student_id AND a.class_id = c.id
        GROUP BY c.id, c.name, t.full_name
    )
    SELECT 
        c_id,
        c_name,
        t_name,
        s_count,
        ROUND(avg_gpa::numeric, 2),
        ROUND(att_rate::numeric, 1),
        ROUND(p_rate::numeric, 1)
    FROM class_stats
    ORDER BY avg_gpa DESC;
END;
$$;
