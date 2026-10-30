ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS result_path TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO UPDATE
SET public = false;
