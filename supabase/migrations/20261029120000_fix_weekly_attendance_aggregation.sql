-- Keep weekly dashboard attendance consistent with operational reports.
-- Late students count as attended, and scoped dashboards retain empty weekdays.
CREATE OR REPLACE FUNCTION get_weekly_attendance(p_teacher_id UUID DEFAULT NULL)
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
    week_start := date_trunc('week', CURRENT_DATE)::date;
    week_end := week_start + INTERVAL '5 days';

    RETURN QUERY
    WITH week_days AS (
        SELECT generate_series(week_start, week_end, '1 day'::interval)::date AS d
    ),
    scoped_attendance AS (
        SELECT a.date, a.status
        FROM attendance a
        LEFT JOIN classes c ON c.id = a.class_id
        WHERE p_teacher_id IS NULL OR c.teacher_id = p_teacher_id
    ),
    day_stats AS (
        SELECT
            wd.d,
            COUNT(sa.status) FILTER (WHERE sa.status IN ('present', 'late')) AS p_count,
            COUNT(sa.status) AS t_count
        FROM week_days wd
        LEFT JOIN scoped_attendance sa ON sa.date = wd.d
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
        CASE
            WHEN ds.t_count > 0
                THEN ROUND(ds.p_count::numeric / ds.t_count * 100, 1)
            ELSE 0
        END
    FROM day_stats ds
    ORDER BY ds.d;
END;
$$;
