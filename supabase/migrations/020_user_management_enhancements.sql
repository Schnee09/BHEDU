-- Migration 020: User Management Enhancements
-- Enhanced user management with activity tracking and account status

-- Add user management fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create password reset tokens table (for manual admin resets)
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token ON password_reset_requests(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS Policies for user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON user_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON user_activity_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
ON user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for password_reset_requests
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view password reset requests
CREATE POLICY "Admins can view password reset requests"
ON password_reset_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can create password reset requests
CREATE POLICY "Admins can create password reset requests"
ON password_reset_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    action,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action,
    p_description,
    p_metadata,
    now()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_login_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update last login on activity
CREATE TRIGGER trigger_update_last_login
AFTER INSERT ON user_activity_logs
FOR EACH ROW
WHEN (NEW.action = 'login')
EXECUTE FUNCTION update_last_login();

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  admin_count BIGINT,
  teacher_count BIGINT,
  student_count BIGINT,
  recent_signups BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_users,
    COUNT(*) FILTER (WHERE is_active = false)::BIGINT as inactive_users,
    COUNT(*) FILTER (WHERE role = 'admin')::BIGINT as admin_count,
    COUNT(*) FILTER (WHERE role = 'teacher')::BIGINT as teacher_count,
    COUNT(*) FILTER (WHERE role = 'student')::BIGINT as student_count,
    COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::BIGINT as recent_signups
  FROM profiles;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;

-- Comment on tables
COMMENT ON TABLE user_activity_logs IS 'Tracks user actions and system activities for audit purposes';
COMMENT ON TABLE password_reset_requests IS 'Tracks password reset requests initiated by admins';
COMMENT ON COLUMN profiles.is_active IS 'Indicates if the user account is active (can login)';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of the users last successful login';
COMMENT ON COLUMN profiles.created_by IS 'Admin who created this user account';
