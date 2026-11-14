-- Repair schema drift on projects where the original report_exports migration is
-- recorded but the table was removed manually or by an incomplete restore.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  params JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  result_url TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_exports_status
  ON public.report_exports(status);

ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_exports_requested_by_created_at
  ON public.report_exports(requested_by, created_at DESC);
