-- Migration: Final Fix for Superadmin RLS Compatibility
-- Created: 2026-01-30
-- Purpose: Normalize super_admin/owner roles to 'admin' in get_current_user_role()
--          so they pass all existing RLS policy checks that only look for 'admin'/'staff'

-- THIS IS THE CRITICAL FIX!
-- The get_current_user_role() function is used by ALL RLS policies.
-- Old policies only check for 'admin' and 'staff', not 'super_admin' or 'owner'.
-- We normalize super_admin/owner -> 'admin' for backward compatibility with existing policies.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Normalize high-privilege roles to 'admin' for backward-compatible RLS checks
  IF v_role IN ('super_admin', 'owner') THEN
    RETURN 'admin';
  END IF;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also provide a function that returns the ACTUAL role (for UI display, etc.)
CREATE OR REPLACE FUNCTION public.get_actual_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
