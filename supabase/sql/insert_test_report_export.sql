-- Insert a test report_export job (run this in Supabase SQL Editor)
INSERT INTO public.report_exports (type, params, status, created_at)
VALUES (
  'attendance',
  '{"start":"2025-12-01","end":"2025-12-12","school_id":1}'::jsonb,
  'pending',
  now()
)
RETURNING *;
