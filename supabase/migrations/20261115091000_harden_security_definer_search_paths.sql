-- SECURITY DEFINER functions must not inherit a caller-controlled search_path.
-- Keep existing explicit configurations and harden only legacy functions that
-- still rely on PostgreSQL's mutable default.
DO $$
DECLARE
  function_record RECORD;
BEGIN
  FOR function_record IN
    SELECT p.oid::regprocedure AS function_signature
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::TEXT[])) AS setting
        WHERE setting LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path TO public, extensions',
      function_record.function_signature
    );
  END LOOP;
END
$$;
