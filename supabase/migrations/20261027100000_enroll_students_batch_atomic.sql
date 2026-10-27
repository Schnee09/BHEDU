-- Enroll a class list as one transaction. Any invalid student, duplicate active
-- enrollment, or other failure rolls the complete batch back.

CREATE OR REPLACE FUNCTION public.enroll_students_batch_atomic(
  p_student_ids UUID[],
  p_class_id UUID,
  p_enrollment_date DATE DEFAULT current_date,
  p_notes TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS SETOF public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_enrollment public.enrollments;
BEGIN
  IF p_student_ids IS NULL OR cardinality(p_student_ids) = 0 THEN
    RAISE EXCEPTION 'At least one student is required';
  END IF;

  IF cardinality(p_student_ids) > 100 THEN
    RAISE EXCEPTION 'A maximum of 100 students can be enrolled at once';
  END IF;

  IF cardinality(p_student_ids) <> (
    SELECT COUNT(DISTINCT ids.student_id)
    FROM unnest(p_student_ids) AS ids(student_id)
  ) THEN
    RAISE EXCEPTION 'Student list contains duplicates';
  END IF;

  -- Serialize class-level enrollment batches so capacity and duplicate checks
  -- cannot race between two operators handling the same class.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_class_id::TEXT, 0));

  FOREACH v_student_id IN ARRAY p_student_ids LOOP
    SELECT * INTO v_enrollment
    FROM public.enroll_student_atomic(
      v_student_id,
      p_class_id,
      p_enrollment_date,
      p_notes,
      NULL,
      NULL,
      p_actor_id
    );

    RETURN NEXT v_enrollment;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_students_batch_atomic(UUID[], UUID, DATE, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_students_batch_atomic(UUID[], UUID, DATE, TEXT, UUID)
  TO service_role;
