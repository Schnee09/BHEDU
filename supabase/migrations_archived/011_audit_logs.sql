-- Audit log table for tracking admin actions
-- Drop existing table if schema doesn't match
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'create', 'update', 'delete'
  resource_type text NOT NULL, -- 'course', 'lesson', 'user', etc.
  resource_id uuid,
  details jsonb, -- Store old/new values, metadata
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Only admins can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
CREATE POLICY "Admins read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert (server-side logging)
DROP POLICY IF EXISTS "Service role insert audit logs" ON audit_logs;
CREATE POLICY "Service role insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
