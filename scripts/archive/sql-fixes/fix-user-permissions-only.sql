-- SIMPLE FIX: Just create user_permissions table if missing
-- Run this in Supabase SQL Editor

-- Check and create user_permissions only
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL,
  granted_by uuid,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_denied BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(user_id, permission_code)
);

-- Enable RLS and allow access
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_user_permissions" ON public.user_permissions;
CREATE POLICY "allow_all_user_permissions" ON public.user_permissions FOR ALL USING (true) WITH CHECK (true);

-- Grant needed permissions
GRANT ALL ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

-- Verify it was created
SELECT 'user_permissions table ready!' AS status, COUNT(*) as row_count FROM public.user_permissions;
