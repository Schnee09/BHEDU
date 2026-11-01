-- The current attendance workflow records one status per student/class/day.
-- Preserve duplicate history through soft deletion, then enforce that rule for active rows.

WITH ranked_attendance AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY student_id, class_id, date
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.attendance
  WHERE deleted_at IS NULL
)
UPDATE public.attendance attendance
SET
  deleted_at = now(),
  updated_at = now()
FROM ranked_attendance ranked
WHERE attendance.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_active_student_class_date_uidx
  ON public.attendance (student_id, class_id, date)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.upsert_daily_attendance_batch(
  p_class_id uuid,
  p_date date,
  p_records jsonb,
  p_marked_by uuid
)
RETURNS SETOF public.attendance
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.attendance (
    student_id,
    class_id,
    date,
    status,
    remarks,
    enrollment_exception_reason,
    marked_by,
    deleted_at
  )
  SELECT
    (record ->> 'student_id')::uuid,
    p_class_id,
    p_date,
    record ->> 'status',
    NULLIF(record ->> 'notes', ''),
    NULLIF(btrim(record ->> 'enrollment_exception_reason'), ''),
    p_marked_by,
    NULL
  FROM jsonb_array_elements(p_records) AS record
  ON CONFLICT (student_id, class_id, date) WHERE deleted_at IS NULL
  DO UPDATE SET
    status = EXCLUDED.status,
    remarks = EXCLUDED.remarks,
    enrollment_exception_reason = EXCLUDED.enrollment_exception_reason,
    marked_by = EXCLUDED.marked_by,
    updated_at = now()
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.upsert_daily_attendance_batch(uuid, date, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_daily_attendance_batch(uuid, date, jsonb, uuid)
  TO service_role;

COMMENT ON FUNCTION public.upsert_daily_attendance_batch(uuid, date, jsonb, uuid) IS
  'Atomically records one active attendance status per student, class, and date.';
