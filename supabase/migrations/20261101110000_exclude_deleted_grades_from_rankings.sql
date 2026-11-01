-- Keep center-wide grade rankings consistent with soft-delete semantics used by
-- the application. The p_limit argument remains for API compatibility; callers
-- need the complete ranked set to derive both top-performing and at-risk lists.
CREATE OR REPLACE FUNCTION public.get_student_rankings(p_limit INTEGER DEFAULT 10)
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
      (
        SELECT c.name
        FROM public.enrollments e
        JOIN public.classes c ON c.id = e.class_id
        WHERE e.student_id = p.id
          AND e.deleted_at IS NULL
          AND c.deleted_at IS NULL
        ORDER BY e.enrollment_date DESC, e.created_at DESC
        LIMIT 1
      ) AS c_name,
      AVG(g.score) AS avg_score
    FROM public.profiles p
    JOIN public.grades g
      ON g.student_id = p.id
      AND g.deleted_at IS NULL
    WHERE p.role = 'student'
      AND p.deleted_at IS NULL
    GROUP BY p.id, p.full_name
  ),
  ranked_students AS (
    SELECT
      s_id,
      s_name,
      COALESCE(c_name, 'Chưa xếp lớp') AS c_name,
      ROUND(avg_score::NUMERIC, 2) AS avg_score,
      RANK() OVER (ORDER BY avg_score DESC) AS rnk,
      ROUND(PERCENT_RANK() OVER (ORDER BY avg_score ASC)::NUMERIC * 100, 0) AS ptile
    FROM student_averages
  )
  SELECT s_id, s_name, c_name, avg_score, rnk, ptile
  FROM ranked_students
  ORDER BY avg_score DESC;
END;
$$;
