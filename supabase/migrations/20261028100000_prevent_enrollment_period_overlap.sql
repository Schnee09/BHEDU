-- Prevent overlapping enrollment periods for the same student and class.
-- Both bounds are inclusive: end_date is the student's final day in class.

CREATE OR REPLACE FUNCTION public.prevent_enrollment_period_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.enrollment_date IS NULL THEN
    RAISE EXCEPTION 'Enrollment start date is required';
  END IF;

  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.enrollment_date THEN
    RAISE EXCEPTION 'Enrollment end date cannot precede start date';
  END IF;

  -- Serialize checks for this student/class pair to prevent concurrent inserts
  -- from both observing an empty interval.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.student_id::TEXT || ':' || NEW.class_id::TEXT, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.enrollments existing
    WHERE existing.student_id = NEW.student_id
      AND existing.class_id = NEW.class_id
      AND existing.id IS DISTINCT FROM NEW.id
      AND existing.deleted_at IS NULL
      AND existing.enrollment_date <= COALESCE(NEW.end_date, 'infinity'::DATE)
      AND COALESCE(existing.end_date, 'infinity'::DATE) >= NEW.enrollment_date
  ) THEN
    RAISE EXCEPTION 'Enrollment period overlaps an existing enrollment for this class';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_enrollment_period_overlap ON public.enrollments;
CREATE TRIGGER prevent_enrollment_period_overlap
  BEFORE INSERT OR UPDATE OF student_id, class_id, enrollment_date, end_date, deleted_at
  ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_enrollment_period_overlap();

COMMENT ON FUNCTION public.prevent_enrollment_period_overlap() IS
  'Prevents inclusive enrollment date ranges from overlapping for one student and class.';
