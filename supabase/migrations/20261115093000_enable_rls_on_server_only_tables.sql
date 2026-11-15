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

GRANT ALL ON TABLE public.attendance_reports TO service_role;
GRANT ALL ON TABLE public.guardians TO service_role;
GRANT ALL ON TABLE public.import_errors TO service_role;
GRANT ALL ON TABLE public.import_logs TO service_role;
GRANT ALL ON TABLE public.profiles_backup_student_codes TO service_role;
GRANT ALL ON TABLE public.qr_codes TO service_role;
GRANT ALL ON TABLE public.report_exports TO service_role;
