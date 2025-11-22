-- Comprehensive RLS Policy Fix for All Tables
-- Date: 2025-01-16
-- Issue: Many tables use auth.role() = 'service_role' which doesn't work for admin users
-- Fix: Add proper RLS policies for admin/teacher/student access

------------------------------------------------------------
-- FIX: notifications table
------------------------------------------------------------
-- Deprecated migration - replaced by targeted 027 fix
DO $$ BEGIN
  RAISE NOTICE 'Skipping deprecated migration 026 (no-op).';
END $$;
