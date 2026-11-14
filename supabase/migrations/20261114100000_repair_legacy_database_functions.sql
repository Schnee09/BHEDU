-- Repair legacy functions that survived earlier schema changes. Rewriting the
-- existing definitions preserves their signatures, return types and grants
-- across databases whose historical schemas may differ slightly.
DO $$
DECLARE
  function_record RECORD;
  repaired_definition TEXT;
BEGIN
  FOR function_record IN
    SELECT p.oid, p.proname
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('is_admin', 'is_teacher', 'is_student')
      AND pg_get_function_identity_arguments(p.oid) = 'user_id uuid'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'WHERE id = user_id',
      'WHERE id = $1'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'is_enrolled_in_class',
        'has_active_enrollments',
        'get_student_enrollment_count',
        'get_class_enrollment_count',
        'get_student_with_enrollments',
        'user_enrolled_in_class'
      )
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'status = ''active''',
      'status = ''enrolled'''
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
      'e.enrollment_date DESC, e.created_at DESC',
      'e.enrollment_date DESC, e.id DESC'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'generate_qr_code'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'gen_random_bytes(',
      'extensions.gen_random_bytes('
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
    repaired_definition := replace(
      repaired_definition,
      ', checked_in_at)',
      ')'
    );
    repaired_definition := replace(
      repaired_definition,
      ', NOW())',
      ')'
    );
    repaired_definition := regexp_replace(
      repaired_definition,
      ',[[:space:]]*checked_in_at = NOW\(\)',
      '',
      'g'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'batch_insert_enrollments'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'VALUES (student_id, p_class_id, p_enrollment_date, p_status)',
      'VALUES (student_id, p_class_id, p_enrollment_date, CASE WHEN p_status = ''active'' THEN ''enrolled''::public.enrollment_status ELSE p_status::public.enrollment_status END)'
    );
    EXECUTE repaired_definition;
  END LOOP;

  FOR function_record IN
    SELECT p.oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('refund_payment_atomic', 'allocate_student_payment_atomic')
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'v_payment.status IN (',
      'v_payment.status::text IN ('
    );
    EXECUTE repaired_definition;
  END LOOP;
END
$$;
