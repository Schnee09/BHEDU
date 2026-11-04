-- Align dashboard distributions with soft-delete rules and the application's
-- definition of attendance (present and late both count as attended).

CREATE OR REPLACE FUNCTION public.get_grade_distribution(p_teacher_id UUID DEFAULT NULL)
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
    FROM public.grades g
    JOIN public.profiles p
      ON p.id = g.student_id
      AND p.deleted_at IS NULL
    JOIN public.classes c
      ON c.id = g.class_id
      AND c.deleted_at IS NULL
    WHERE p.role = 'student'
      AND g.deleted_at IS NULL
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    GROUP BY g.student_id
    HAVING COUNT(g.score) > 0
  )
  SELECT b.band_name, COUNT(sa.student_id)
  FROM (
    VALUES
      ('Giỏi'::TEXT, 8.0::NUMERIC, 10.01::NUMERIC),
      ('Khá'::TEXT, 6.5::NUMERIC, 8.0::NUMERIC),
      ('Trung bình'::TEXT, 5.0::NUMERIC, 6.5::NUMERIC),
      ('Yếu'::TEXT, 0.0::NUMERIC, 5.0::NUMERIC)
  ) AS b(band_name, lower_bound, upper_bound)
  LEFT JOIN student_averages sa
    ON sa.avg_score >= b.lower_bound
    AND sa.avg_score < b.upper_bound
  GROUP BY b.band_name, b.lower_bound
  ORDER BY b.lower_bound DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_attendance(p_teacher_id UUID DEFAULT NULL)
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
  week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  week_end DATE := week_start + 5;
BEGIN
  RETURN QUERY
  WITH week_days AS (
    SELECT generate_series(week_start, week_end, '1 day'::INTERVAL)::DATE AS d
  ),
  day_stats AS (
    SELECT
      wd.d,
      COUNT(a.id) FILTER (WHERE a.status::TEXT IN ('present', 'late')) AS p_count,
      COUNT(a.id) AS t_count
    FROM week_days wd
    LEFT JOIN public.attendance a
      ON a.date = wd.d
      AND a.deleted_at IS NULL
    LEFT JOIN public.classes c
      ON c.id = a.class_id
      AND c.deleted_at IS NULL
    WHERE p_teacher_id IS NULL OR c.teacher_id = p_teacher_id
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
      WHEN ds.t_count > 0 THEN ROUND(ds.p_count::NUMERIC / ds.t_count * 100, 1)
      ELSE 0
    END
  FROM day_stats ds
  ORDER BY ds.d;
END;
$$;
