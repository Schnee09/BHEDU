-- Migration: Grant Access to role_permission_overrides Table
-- Created: 2026-06-05
-- Purpose: Grant SELECT permission to authenticated users (and anon) to resolve client-side hook 403 errors.

-- Grant SELECT access so client-side queries can read overrides
GRANT SELECT ON public.role_permission_overrides TO authenticated;
GRANT SELECT ON public.role_permission_overrides TO anon;

-- Ensure service_role has full management privileges
GRANT ALL PRIVILEGES ON public.role_permission_overrides TO service_role;
GRANT ALL PRIVILEGES ON public.role_permission_overrides TO postgres;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
