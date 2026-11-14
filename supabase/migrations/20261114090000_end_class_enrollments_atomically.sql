CREATE OR REPLACE FUNCTION public.end_class_enrollments_atomic(
  p_class_id UUID,
  p_end_date DATE,
  p_reason TEXT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ended_count INTEGER;
BEGIN
  IF NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  WITH ended AS (
    UPDATE public.enrollments
    SET status = 'dropped'::public.enrollment_status,
        end_date = p_end_date,
        status_reason = btrim(p_reason),
        ended_at = now(),
        ended_by = p_actor_id,
        updated_by = p_actor_id,
        updated_at = now()
    WHERE class_id = p_class_id
      AND status = 'enrolled'
      AND deleted_at IS NULL
      AND enrollment_date <= p_end_date
    RETURNING id
  )
  INSERT INTO public.enrollment_events (
    enrollment_id, event_type, effective_date, reason, actor_id
  )
  SELECT id, 'dropped', p_end_date, btrim(p_reason), p_actor_id
  FROM ended;

  GET DIAGNOSTICS v_ended_count = ROW_COUNT;
  RETURN v_ended_count;
END;
$$;

REVOKE ALL ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID)
  TO service_role;

COMMENT ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID) IS
  'Ends all active enrollments in a class and records one lifecycle event per enrollment.';
