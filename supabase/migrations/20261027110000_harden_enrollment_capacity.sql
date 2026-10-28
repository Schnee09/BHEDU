-- Keep class capacity enforcement consistent for single and batch enrollment.

CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  max_cap INTEGER;
BEGIN
  -- Historical or soft-deleted rows do not occupy a current class seat.
  IF NEW.status::TEXT <> 'enrolled' OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Use the same transaction lock as the batch enrollment command so two
  -- operators cannot both pass the capacity check for the final seat.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.class_id::TEXT, 0));

  SELECT COALESCE(c.capacity, c.max_capacity, 12)
  INTO max_cap
  FROM public.classes c
  WHERE c.id = NEW.class_id
    AND c.deleted_at IS NULL;

  IF max_cap IS NULL THEN
    RAISE EXCEPTION 'Class not found or inactive';
  END IF;

  SELECT COUNT(*)
  INTO current_count
  FROM public.enrollments e
  WHERE e.class_id = NEW.class_id
    AND e.status::TEXT = 'enrolled'
    AND e.deleted_at IS NULL;

  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'Lớp đã đủ sĩ số tối đa (% học sinh)', max_cap;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_enrollment_capacity ON public.enrollments;
CREATE TRIGGER check_enrollment_capacity
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_class_capacity();

COMMENT ON FUNCTION public.check_class_capacity() IS
  'Enforces current class capacity under a class-scoped transaction lock.';
