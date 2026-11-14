-- Role helpers are called with auth.users.id. Some legacy profiles use the
-- same value as profiles.id, while newer profiles store it in profiles.user_id.
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
      AND p.proname IN ('is_admin', 'is_teacher', 'is_student')
      AND pg_get_function_identity_arguments(p.oid) = 'user_id uuid'
  LOOP
    repaired_definition := pg_get_functiondef(function_record.oid);
    repaired_definition := replace(
      repaired_definition,
      'WHERE id = $1',
      'WHERE profiles.user_id = $1 OR profiles.id = $1'
    );
    EXECUTE repaired_definition;
  END LOOP;
END
$$;
