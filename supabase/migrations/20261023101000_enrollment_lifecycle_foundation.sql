-- Enrollment lifecycle foundation for Reception 360.
-- Preserves existing rows while enabling effective-dated history and atomic
-- enroll/end/transfer operations.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS previous_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT,
  ADD COLUMN IF NOT EXISTS source_key TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_student_class_unique,
  DROP CONSTRAINT IF EXISTS enrollments_student_class_key;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_date_range_valid;
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_date_range_valid
  CHECK (end_date IS NULL OR end_date >= enrollment_date) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_one_active_student_class
  ON public.enrollments(student_id, class_id)
  WHERE status = 'enrolled' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_source_key
  ON public.enrollments(source_system, source_key)
  WHERE source_system IS NOT NULL AND source_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_student_effective_dates
  ON public.enrollments(student_id, enrollment_date, end_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_effective_dates
  ON public.enrollments(class_id, enrollment_date, end_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_previous
  ON public.enrollments(previous_enrollment_id)
  WHERE previous_enrollment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.enrollment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('enrolled', 'completed', 'dropped', 'withdrawn', 'transferred')),
  effective_date DATE NOT NULL,
  reason TEXT,
  related_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_events_enrollment
  ON public.enrollment_events(enrollment_id, created_at DESC);

ALTER TABLE public.enrollment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authorized users view enrollment events" ON public.enrollment_events;
CREATE POLICY "Authorized users view enrollment events"
  ON public.enrollment_events FOR SELECT TO authenticated
  USING (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR EXISTS (
      SELECT 1
      FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      JOIN public.profiles p ON p.id = c.teacher_id
      WHERE e.id = enrollment_events.enrollment_id
        AND p.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.enrollment_events TO authenticated;
GRANT ALL ON public.enrollment_events TO service_role;

CREATE OR REPLACE FUNCTION public.enroll_student_atomic(
  p_student_id UUID,
  p_class_id UUID,
  p_enrollment_date DATE DEFAULT current_date,
  p_notes TEXT DEFAULT NULL,
  p_source_system TEXT DEFAULT NULL,
  p_source_key TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.enrollments;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_student_id AND role = 'student' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Student not found or inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Class not found or inactive';
  END IF;

  PERFORM 1 FROM public.enrollments
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND status = 'enrolled'
    AND deleted_at IS NULL
  FOR UPDATE;

  IF FOUND THEN
    RAISE EXCEPTION 'Student is already enrolled in this class';
  END IF;

  IF p_source_system IS NOT NULL AND p_source_key IS NOT NULL THEN
    SELECT * INTO v_enrollment
    FROM public.enrollments
    WHERE source_system = p_source_system AND source_key = p_source_key;

    IF FOUND THEN
      RETURN v_enrollment;
    END IF;
  END IF;

  INSERT INTO public.enrollments (
    student_id, class_id, enrollment_date, status, notes,
    source_system, source_key, created_by, updated_by
  ) VALUES (
    p_student_id, p_class_id, p_enrollment_date, 'enrolled', p_notes,
    p_source_system, p_source_key, p_actor_id, p_actor_id
  )
  RETURNING * INTO v_enrollment;

  INSERT INTO public.enrollment_events (
    enrollment_id, event_type, effective_date, reason, actor_id
  ) VALUES (
    v_enrollment.id, 'enrolled', p_enrollment_date, p_notes, p_actor_id
  );

  RETURN v_enrollment;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_enrollment_atomic(
  p_enrollment_id UUID,
  p_end_date DATE,
  p_status TEXT,
  p_reason TEXT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.enrollments;
BEGIN
  IF p_status NOT IN ('completed', 'dropped', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid terminal enrollment status';
  END IF;

  IF NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE id = p_enrollment_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;
  IF v_enrollment.status <> 'enrolled' THEN
    RAISE EXCEPTION 'Only active enrollments can be ended';
  END IF;
  IF p_end_date < v_enrollment.enrollment_date THEN
    RAISE EXCEPTION 'End date cannot precede enrollment date';
  END IF;

  UPDATE public.enrollments
  SET status = p_status::public.enrollment_status,
      end_date = p_end_date,
      status_reason = btrim(p_reason),
      ended_at = now(),
      ended_by = p_actor_id,
      updated_by = p_actor_id,
      updated_at = now()
  WHERE id = p_enrollment_id
  RETURNING * INTO v_enrollment;

  INSERT INTO public.enrollment_events (
    enrollment_id, event_type, effective_date, reason, actor_id
  ) VALUES (
    v_enrollment.id, p_status, p_end_date, btrim(p_reason), p_actor_id
  );

  RETURN v_enrollment;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_student_atomic(
  p_enrollment_id UUID,
  p_to_class_id UUID,
  p_effective_date DATE,
  p_reason TEXT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source public.enrollments;
  v_target public.enrollments;
BEGIN
  IF NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'A transfer reason is required';
  END IF;

  SELECT * INTO v_source
  FROM public.enrollments
  WHERE id = p_enrollment_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source enrollment not found';
  END IF;
  IF v_source.status <> 'enrolled' THEN
    RAISE EXCEPTION 'Only active enrollments can be transferred';
  END IF;
  IF v_source.class_id = p_to_class_id THEN
    RAISE EXCEPTION 'Source and destination classes must differ';
  END IF;
  IF p_effective_date < v_source.enrollment_date THEN
    RAISE EXCEPTION 'Transfer date cannot precede enrollment date';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_to_class_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Destination class not found or inactive';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE student_id = v_source.student_id
      AND class_id = p_to_class_id
      AND status = 'enrolled'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Student is already enrolled in the destination class';
  END IF;

  UPDATE public.enrollments
  SET status = 'transferred',
      end_date = p_effective_date,
      status_reason = btrim(p_reason),
      ended_at = now(),
      ended_by = p_actor_id,
      updated_by = p_actor_id,
      updated_at = now()
  WHERE id = v_source.id;

  INSERT INTO public.enrollments (
    student_id, class_id, enrollment_date, status, notes,
    previous_enrollment_id, created_by, updated_by
  ) VALUES (
    v_source.student_id, p_to_class_id, p_effective_date, 'enrolled',
    'Transferred: ' || btrim(p_reason), v_source.id, p_actor_id, p_actor_id
  )
  RETURNING * INTO v_target;

  INSERT INTO public.enrollment_events (
    enrollment_id, event_type, effective_date, reason,
    related_enrollment_id, actor_id
  ) VALUES
    (v_source.id, 'transferred', p_effective_date, btrim(p_reason), v_target.id, p_actor_id),
    (v_target.id, 'enrolled', p_effective_date, btrim(p_reason), v_source.id, p_actor_id);

  RETURN v_target;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_student_atomic(UUID, UUID, DATE, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.end_enrollment_atomic(UUID, DATE, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transfer_student_atomic(UUID, UUID, DATE, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_student_atomic(UUID, UUID, DATE, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.end_enrollment_atomic(UUID, DATE, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.transfer_student_atomic(UUID, UUID, DATE, TEXT, UUID) TO service_role;
