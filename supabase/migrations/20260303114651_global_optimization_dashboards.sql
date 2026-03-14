-- ============================================================================
-- Dashboards Global Optimization
-- Description: Creates highly optimized database RPCs for Analytics Dashboards
-- to prevent O(N*M) memory computations on the Next.js server.
-- ============================================================================

-- 1. get_student_rankings
-- Returns all students ranked by their computed average grade.
CREATE OR REPLACE FUNCTION get_student_rankings(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    class_name TEXT,
    average NUMERIC,
    rank BIGINT,
    percentile NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH student_averages AS (
        SELECT 
            p.id AS s_id,
            p.full_name AS s_name,
            -- Get primary class name
            (
                SELECT c.name 
                FROM enrollments e 
                JOIN classes c ON c.id = e.class_id 
                WHERE e.student_id = p.id 
                LIMIT 1
            ) AS c_name,
            -- Compute exact average
            COALESCE(AVG(g.score), 0) AS avg_score
        FROM profiles p
        LEFT JOIN grades g ON g.student_id = p.id
        WHERE p.role = 'student'
        GROUP BY p.id, p.full_name
        HAVING COUNT(g.score) > 0 -- Only rank active students with grades
    ),
    ranked_students AS (
        SELECT 
            s_id,
            s_name,
            COALESCE(c_name, 'N/A') AS c_name,
            ROUND(avg_score::numeric, 2) AS avg_score,
            RANK() OVER (ORDER BY avg_score DESC) AS rnk,
            -- Pre-calculate percentile for the ranking widget
            ROUND(PERCENT_RANK() OVER (ORDER BY avg_score ASC)::numeric * 100, 0) AS ptile
        FROM student_averages
    )
    SELECT 
        s_id, 
        s_name, 
        c_name, 
        avg_score, 
        rnk, 
        ptile
    FROM ranked_students
    ORDER BY avg_score DESC;
END;
$$;

-- 2. get_class_averages
-- Returns aggregated stats for ClassComparison widget
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
        LEFT JOIN grades g ON g.student_id = e.student_id
        LEFT JOIN attendance a ON a.student_id = e.student_id
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

-- 3. get_school_metrics
-- Returns global aggregates for SchoolMetrics widget
CREATE OR REPLACE FUNCTION get_school_metrics()
RETURNS TABLE (
    total_students BIGINT,
    total_teachers BIGINT,
    total_classes BIGINT,
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
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE role = 'student') AS total_students,
        (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') AS total_teachers,
        (SELECT COUNT(*) FROM classes) AS total_classes,
        COALESCE(ROUND(AVG(score)::numeric, 2), 0) AS average_gpa,
        COALESCE(ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(id), 0) * 100)::numeric, 1), 0) AS attendance_rate,
        COALESCE(ROUND((SUM(CASE WHEN score >= 5.0 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(score), 0) * 100)::numeric, 1), 0) AS pass_rate
    FROM (
        SELECT score, NULL AS status, NULL AS id FROM grades
        UNION ALL
        SELECT NULL, status, id FROM attendance
    ) combined_stats;
END;
$$;
