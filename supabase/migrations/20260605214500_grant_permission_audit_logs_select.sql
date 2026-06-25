-- Migration: Grant Select Access to permission_audit_logs Table
-- Created: 2026-06-05
-- Purpose: Grant SELECT permission to authenticated users to resolve database 42501 (permission denied) errors.

-- Grant SELECT access so authenticated client-side queries can read audit logs
GRANT SELECT ON public.permission_audit_logs TO authenticated;

-- Ensure service_role has full management privileges
GRANT ALL PRIVILEGES ON public.permission_audit_logs TO service_role;
GRANT ALL PRIVILEGES ON public.permission_audit_logs TO postgres;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
