-- Dashboard Perfection: Grade Distribution + Weekly Attendance RPCs
--
-- 1. get_grade_distribution: Returns student counts per grade band
-- 2. get_weekly_attendance: Returns day-by-day attendance rates for current week

-- 1. Grade Distribution RPC
-- Groups students by their average grade into Vietnamese education bands:
--   Giỏi (≥8), Khá (≥6.5), Trung bình (≥5), Yếu (<5)
CREATE OR REPLACE FUNCTION get_grade_distribution()
RETURNS TABLE (
    band TEXT,
    student_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH student_averages AS (
        SELECT 
            g.student_id,
            AVG(g.score) AS avg_score
        FROM grades g
        INNER JOIN profiles p ON p.id = g.student_id
        WHERE p.role = 'student'
        GROUP BY g.student_id
        HAVING COUNT(g.score) > 0
    )
    SELECT 
        b.band_name,
        COUNT(sa.student_id)
    FROM (
        VALUES 
            ('Giỏi', 8.0, 10.01),
            ('Khá', 6.5, 8.0),
            ('TB', 5.0, 6.5),
            ('Yếu', 0.0, 5.0)
    ) AS b(band_name, lower_bound, upper_bound)
    LEFT JOIN student_averages sa 
        ON sa.avg_score >= b.lower_bound AND sa.avg_score < b.upper_bound
    GROUP BY b.band_name, b.lower_bound
    ORDER BY b.lower_bound DESC;
END;
$$;

-- 2. Weekly Attendance RPC
-- Returns attendance rates for each day of the current week (Mon-Sat)
CREATE OR REPLACE FUNCTION get_weekly_attendance()
RETURNS TABLE (
    day_name TEXT,
    day_date DATE,
    present_count BIGINT,
    total_count BIGINT,
    attendance_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    week_start DATE;
    week_end DATE;
BEGIN
    -- Calculate current week boundaries (Monday to Saturday)
    week_start := date_trunc('week', CURRENT_DATE)::date;
    week_end := week_start + INTERVAL '5 days';

    RETURN QUERY
    WITH week_days AS (
        SELECT 
            generate_series(week_start, week_end, '1 day'::interval)::date AS d
    ),
    day_stats AS (
        SELECT
            wd.d,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS p_count,
            COUNT(a.id) AS t_count
        FROM week_days wd
        LEFT JOIN attendance a ON a.date = wd.d
        GROUP BY wd.d
    )
    SELECT
        CASE EXTRACT(DOW FROM ds.d)
            WHEN 1 THEN 'T2'
            WHEN 2 THEN 'T3'
            WHEN 3 THEN 'T4'
            WHEN 4 THEN 'T5'
            WHEN 5 THEN 'T6'
            WHEN 6 THEN 'T7'
            WHEN 0 THEN 'CN'
        END,
        ds.d,
        ds.p_count,
        ds.t_count,
        CASE WHEN ds.t_count > 0 
            THEN ROUND((ds.p_count::numeric / ds.t_count * 100)::numeric, 1)
            ELSE 0 
        END
    FROM day_stats ds
    ORDER BY ds.d;
END;
$$;
