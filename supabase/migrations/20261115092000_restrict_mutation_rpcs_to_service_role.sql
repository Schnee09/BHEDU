-- Mutation RPCs are invoked only by guarded server routes. Keep them out of
-- PostgREST roles so callers cannot bypass application authorization.
DO $$
DECLARE
  function_record RECORD;
BEGIN
  FOR function_record IN
    SELECT p.oid::regprocedure AS function_signature
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'allocate_student_payment_atomic',
        'batch_insert_enrollments',
        'cancel_unpaid_invoice_atomic',
        'check_in_with_qr',
        'confirm_bank_transaction_payment',
        'create_monthly_tuition_invoice',
        'end_class_enrollments_atomic',
        'end_enrollment_atomic',
        'enroll_student_atomic',
        'enroll_students_batch_atomic',
        'generate_qr_code',
        'import_bank_statement',
        'record_invoice_payment_atomic',
        'record_student_payment_atomic',
        'refresh_performance_views',
        'refund_payment_atomic',
        'transfer_student_atomic',
        'upsert_daily_attendance_batch'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      function_record.function_signature
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO service_role',
      function_record.function_signature
    );
  END LOOP;
END
$$;
