-- Fix fan-trap in get_class_averages RPC
-- Previous implementation joined grades and attendance simultaneously, creating a Cartesian product.
-- This version aggregates them separately before joining.

CREATE OR REPLACE FUNCTION get_class_averages(p_teacher_id UUID DEFAULT NULL)
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
    WITH class_base AS (
        -- Base class info and student counts
        SELECT 
            c.id AS c_id,
            c.name AS c_name,
            COALESCE(t.full_name, 'Chưa phân công') AS t_name,
            COUNT(DISTINCT e.student_id) AS s_count
        FROM classes c
        LEFT JOIN profiles t ON t.id = c.teacher_id
        LEFT JOIN enrollments e ON e.class_id = c.id
        WHERE (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
        GROUP BY c.id, c.name, t.full_name
    ),
    grade_stats AS (
        -- Aggregate grades separately
        SELECT 
            g.class_id,
            AVG(g.score) AS avg_gpa,
            (COUNT(g.id) FILTER (WHERE g.score >= 5.0))::numeric / NULLIF(COUNT(g.id), 0) * 100 AS p_rate
        FROM grades g
        GROUP BY g.class_id
    ),
    attendance_stats AS (
        -- Aggregate attendance separately
        SELECT 
            a.class_id,
            (COUNT(a.id) FILTER (WHERE a.status = 'present'))::numeric / NULLIF(COUNT(a.id), 0) * 100 AS att_rate
        FROM attendance a
        GROUP BY a.class_id
    )
    SELECT 
        cb.c_id,
        cb.c_name,cb.t_name,
        cb.s_count,
        ROUND(COALESCE(gs.avg_gpa, 0)::numeric, 2) as average_gpa,
        ROUND(COALESCE(as_stats.att_rate, 0)::numeric, 1) as attendance_rate,
        ROUND(COALESCE(gs.p_rate, 0)::numeric, 1) as pass_rate
    FROM class_base cb
    LEFT JOIN grade_stats gs ON gs.class_id = cb.c_id
    LEFT JOIN attendance_stats as_stats ON as_stats.class_id = cb.c_id
    ORDER BY average_gpa DESC;
END;
$$;
