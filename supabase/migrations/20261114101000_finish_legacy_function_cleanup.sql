-- The student/date QR overload targets columns removed when QR attendance was
-- standardized around class tokens. No application code calls this overload.
DROP FUNCTION IF EXISTS public.generate_qr_code(UUID, DATE, INTEGER);

DO $$
DECLARE
  function_record RECORD;
  repaired_definition TEXT;
BEGIN
  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_student_with_enrollments'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'e.status as enrollment_status',
      'e.status::text as enrollment_status'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_student_rankings'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      E'BEGIN\n  RETURN QUERY',
      E'BEGIN\n  PERFORM p_limit;\n  RETURN QUERY'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'check_in_with_qr'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := regexp_replace(
      repaired_definition,
      E'\n[[:space:]]*result[[:space:]]+JSON;',
      '',
      'i'
    );
    EXECUTE repaired_definition;
  END LOOP;
END
$$;
