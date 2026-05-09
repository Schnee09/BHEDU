
-- Migration: Fix Enrollment Capacity Trigger
-- Created: 2026-05-09
-- Purpose: Update check_class_capacity to use 'enrolled' status instead of legacy 'active' string.

CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_cap INTEGER;
BEGIN
  -- Get current enrollment count
  -- UPDATED: status = 'enrolled' instead of 'active'
  SELECT COUNT(*) INTO current_count
  FROM public.enrollments
  WHERE class_id = NEW.class_id AND status = 'enrolled';

  -- Get max capacity
  SELECT COALESCE(max_capacity, 12) INTO max_cap
  FROM public.classes
  WHERE id = NEW.class_id;

  -- Check if at capacity
  IF current_count >= max_cap THEN
    RAISE EXCEPTION 'Lớp đã đạt giới hạn tối đa (% học sinh)', max_cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-establish the trigger just in case
DROP TRIGGER IF EXISTS check_enrollment_capacity ON public.enrollments;
CREATE TRIGGER check_enrollment_capacity
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_class_capacity();

COMMENT ON FUNCTION public.check_class_capacity() IS 'Checks if a class has reached its student limit before allowing new enrollments.';
