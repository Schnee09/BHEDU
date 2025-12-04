-- Migration: Audit Logs System
-- Description: Create audit_logs table for tracking all sensitive operations
-- Version: 003
-- Date: 2024

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table for compliance
-- Note: user_id can be NULL if user is deleted, but we keep email/role for historical record
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,  -- No FK constraint to avoid dependency on profiles table structure
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB,
  metadata JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs (no one can update/delete)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent updates and deletes to maintain immutable audit trail
CREATE POLICY "Prevent audit log modifications"
  ON audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Prevent audit log deletions"
  ON audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and security. Tracks all sensitive operations including user management, grade changes, and financial transactions.';

COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of the user (denormalized for historical accuracy)';
COMMENT ON COLUMN audit_logs.user_role IS 'Role of the user at the time of action';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., user.created, grade.updated)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, grade, invoice)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with old/new values for changed fields';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context for the action';
COMMENT ON COLUMN audit_logs.ip IS 'IP address of the user (if available)';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser user agent (if available)';
