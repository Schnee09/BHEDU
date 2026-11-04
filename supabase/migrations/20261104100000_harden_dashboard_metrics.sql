-- Keep dashboard RPCs aligned with soft-delete and active-enrollment rules.
-- Aggregates stay isolated to avoid multiplying grade and attendance rows.

CREATE OR REPLACE FUNCTION public.get_class_averages(p_teacher_id UUID DEFAULT NULL)
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
    SELECT
      c.id AS c_id,
      c.name AS c_name,
      COALESCE(t.full_name, 'Chưa phân công') AS t_name,
      COUNT(DISTINCT e.student_id) AS s_count
    FROM public.classes c
    LEFT JOIN public.profiles t
      ON t.id = c.teacher_id
      AND t.deleted_at IS NULL
    LEFT JOIN public.enrollments e
      ON e.class_id = c.id
      AND e.deleted_at IS NULL
      AND e.enrollment_date <= CURRENT_DATE
      AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE)
      AND e.status::TEXT IN ('enrolled', 'active')
    WHERE c.deleted_at IS NULL
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    GROUP BY c.id, c.name, t.full_name
  ),
  grade_stats AS (
    SELECT
      g.class_id,
      AVG(g.score) AS avg_gpa,
      (COUNT(g.score) FILTER (WHERE g.score >= 5.0))::NUMERIC
        / NULLIF(COUNT(g.score), 0) * 100 AS p_rate
    FROM public.grades g
    WHERE g.deleted_at IS NULL
    GROUP BY g.class_id
  ),
  attendance_stats AS (
    SELECT
      a.class_id,
      (COUNT(a.id) FILTER (WHERE a.status::TEXT IN ('present', 'late')))::NUMERIC
        / NULLIF(COUNT(a.id), 0) * 100 AS att_rate
    FROM public.attendance a
    WHERE a.deleted_at IS NULL
    GROUP BY a.class_id
  )
  SELECT
    cb.c_id,
    cb.c_name,
    cb.t_name,
    cb.s_count,
    ROUND(COALESCE(gs.avg_gpa, 0)::NUMERIC, 2),
    ROUND(COALESCE(att.att_rate, 0)::NUMERIC, 1),
    ROUND(COALESCE(gs.p_rate, 0)::NUMERIC, 1)
  FROM class_base cb
  LEFT JOIN grade_stats gs ON gs.class_id = cb.c_id
  LEFT JOIN attendance_stats att ON att.class_id = cb.c_id
  ORDER BY COALESCE(gs.avg_gpa, 0) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_school_metrics()
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
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'student' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher' AND deleted_at IS NULL),
    (SELECT COUNT(*) FROM public.classes WHERE deleted_at IS NULL),
    COALESCE((
      SELECT ROUND(AVG(score)::NUMERIC, 2)
      FROM public.grades
      WHERE deleted_at IS NULL
    ), 0),
    COALESCE((
      SELECT ROUND(
        (COUNT(id) FILTER (WHERE status::TEXT IN ('present', 'late')))::NUMERIC
          / NULLIF(COUNT(id), 0) * 100,
        1
      )
      FROM public.attendance
      WHERE deleted_at IS NULL
    ), 0),
    COALESCE((
      SELECT ROUND(
        (COUNT(score) FILTER (WHERE score >= 5.0))::NUMERIC
          / NULLIF(COUNT(score), 0) * 100,
        1
      )
      FROM public.grades
      WHERE deleted_at IS NULL
    ), 0);
END;
$$;
