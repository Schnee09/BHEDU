ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_exports_requested_by_created_at
  ON public.report_exports(requested_by, created_at DESC);
