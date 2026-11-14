REVOKE ALL ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID)
  TO service_role;

COMMENT ON FUNCTION public.end_class_enrollments_atomic(UUID, DATE, TEXT, UUID) IS
  'Ends all active enrollments in a class and records one lifecycle event per enrollment.';
