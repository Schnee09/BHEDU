-- Keep one active grade per student and assignment while preserving duplicate
-- history as soft-deleted records.
WITH ranked_active_grades AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, assignment_id
      ORDER BY graded_at DESC NULLS LAST, updated_at DESC NULLS LAST, created_at DESC, id DESC
    ) AS active_rank
  FROM public.grades
  WHERE assignment_id IS NOT NULL
    AND deleted_at IS NULL
)
UPDATE public.grades AS grade
SET deleted_at = now(), updated_at = now()
FROM ranked_active_grades AS ranked
WHERE grade.id = ranked.id
  AND ranked.active_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS grades_unique_active_assignment
  ON public.grades (student_id, assignment_id)
  WHERE assignment_id IS NOT NULL AND deleted_at IS NULL;
