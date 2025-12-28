-- Fix RLS for user_permissions table - Version 2
-- Run in Supabase SQL Editor

-- First, check if table exists and has RLS enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'user_permissions';

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user's profile ID safely
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy: Users can read their own permissions
CREATE POLICY "Users read own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = get_my_profile_id());

-- Policy: Admins can do everything
CREATE POLICY "Admins manage permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Grant select to authenticated users
GRANT SELECT ON public.user_permissions TO authenticated;
