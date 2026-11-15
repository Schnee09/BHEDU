-- These tables contain operational or sensitive data and are accessed only by
-- guarded server routes using the service role. With no client policies, RLS
-- denies direct anon/authenticated access by default.
ALTER TABLE IF EXISTS public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles_backup_student_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_exports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'attendance_reports',
    'guardians',
    'import_errors',
    'import_logs',
    'profiles_backup_student_codes',
    'qr_codes',
    'report_exports'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
    END IF;
  END LOOP;
END
$$;
