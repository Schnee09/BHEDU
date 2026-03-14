-- ============================================================================
-- Fix: RLS infinite recursion
-- Description: Converts get_current_user_role from LANGUAGE sql to LANGUAGE plpgsql.
-- PostgreSQL can aggressively inline LANGUAGE sql functions even if they are 
-- SECURITY DEFINER in certain edge cases, which causes the SELECT statement to 
-- execute within the caller's context, triggering the RLS policy again and 
-- causing infinite recursion.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  var_role text;
BEGIN
  SELECT role INTO var_role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  RETURN var_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
