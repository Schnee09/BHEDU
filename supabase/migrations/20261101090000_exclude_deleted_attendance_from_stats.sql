-- Keep attendance statistics consistent with soft deletion and operational rules.
-- Late students count as attending; deleted records never contribute to totals.

CREATE OR REPLACE FUNCTION public.get_class_attendance_stats(
  p_class_id uuid,
  p_date date
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', count(*),
    'present', count(*) FILTER (WHERE status = 'present'),
    'absent', count(*) FILTER (WHERE status = 'absent'),
    'late', count(*) FILTER (WHERE status = 'late'),
    'excused', count(*) FILTER (WHERE status = 'excused')
  )
  FROM public.attendance
  WHERE class_id = p_class_id
    AND date = p_date
    AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_rate(
  p_student_id uuid,
  p_class_id uuid DEFAULT NULL
)
RETURNS float
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    count(*) FILTER (WHERE status IN ('present', 'late'))::float
      / NULLIF(count(*), 0)::float * 100,
    0
  )
  FROM public.attendance
  WHERE student_id = p_student_id
    AND (p_class_id IS NULL OR class_id = p_class_id)
    AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_attendance(p_teacher_id uuid DEFAULT NULL)
RETURNS TABLE (
  day_name text,
  day_date date,
  present_count bigint,
  total_count bigint,
  attendance_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date;
  week_end date;
BEGIN
  week_start := date_trunc('week', CURRENT_DATE)::date;
  week_end := week_start + INTERVAL '5 days';

  RETURN QUERY
  WITH week_days AS (
    SELECT generate_series(week_start, week_end, '1 day'::interval)::date AS d
  ),
  scoped_attendance AS (
    SELECT a.date, a.status
    FROM public.attendance a
    LEFT JOIN public.classes c ON c.id = a.class_id
    WHERE a.deleted_at IS NULL
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  ),
  day_stats AS (
    SELECT
      wd.d,
      count(sa.status) FILTER (WHERE sa.status IN ('present', 'late')) AS p_count,
      count(sa.status) AS t_count
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
      WHEN ds.t_count > 0 THEN round(ds.p_count::numeric / ds.t_count * 100, 1)
      ELSE 0
    END
  FROM day_stats ds
  ORDER BY ds.d;
END;
$$;
