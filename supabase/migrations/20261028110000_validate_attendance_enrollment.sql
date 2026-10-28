-- Attendance normally requires an effective enrollment on the attendance date.
-- Trial/makeup exceptions remain possible, but must carry an auditable reason.

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS enrollment_exception_reason TEXT;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_exception_reason_valid;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_exception_reason_valid
  CHECK (
    enrollment_exception_reason IS NULL
    OR char_length(btrim(enrollment_exception_reason)) >= 3
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.validate_attendance_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.enrollments enrollment
    WHERE enrollment.student_id = NEW.student_id
      AND enrollment.class_id = NEW.class_id
      AND enrollment.deleted_at IS NULL
      AND enrollment.enrollment_date <= NEW.date
      AND (enrollment.end_date IS NULL OR enrollment.end_date >= NEW.date)
  ) THEN
    NEW.enrollment_exception_reason := NULL;
    RETURN NEW;
  END IF;

  IF NULLIF(btrim(NEW.enrollment_exception_reason), '') IS NULL THEN
    RAISE EXCEPTION
      'Student is not enrolled in this class on the attendance date; an exception reason is required';
  END IF;

  NEW.enrollment_exception_reason := btrim(NEW.enrollment_exception_reason);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_attendance_enrollment ON public.attendance;
CREATE TRIGGER validate_attendance_enrollment
  BEFORE INSERT OR UPDATE OF student_id, class_id, date, enrollment_exception_reason, deleted_at
  ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attendance_enrollment();

COMMENT ON COLUMN public.attendance.enrollment_exception_reason IS
  'Required when recording trial, makeup, or other attendance outside an effective enrollment.';
