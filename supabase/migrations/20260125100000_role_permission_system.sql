-- Migration: Role Permission System - Extended Auth
-- Created: 2026-01-25
-- Purpose: Add phone auth, invitations, parent-student links, account lifecycle

-- ============================================
-- PHASE 1: UPDATE PROFILES TABLE
-- ============================================

-- Add phone authentication fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: phone_verified';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'preferred_auth_method'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_auth_method TEXT DEFAULT 'email'
      CHECK (preferred_auth_method IN ('email', 'phone', 'both'));
    RAISE NOTICE 'Added column: preferred_auth_method';
  END IF;
END $$;

-- Add account status for lifecycle management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active'
      CHECK (account_status IN ('pending', 'active', 'suspended', 'deactivated', 'deleted'));
    RAISE NOTICE 'Added column: account_status';
  END IF;
END $$;

-- Add status change tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status_changed_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status_changed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: status_changed_at';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status_changed_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status_changed_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added column: status_changed_by';
  END IF;
END $$;

-- ============================================
-- PHASE 2: CREATE USER INVITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invitation details
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL 
    CHECK (role IN ('owner', 'admin', 'staff', 'teacher', 'tutor')),
  
  -- Token for secure signup
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Tracking
  invited_by UUID NOT NULL REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_role ON user_invitations(role);

COMMENT ON TABLE user_invitations IS 'Manages invite tokens for role-based user registration';
COMMENT ON COLUMN user_invitations.token IS 'Secure random token sent to invitee';
COMMENT ON COLUMN user_invitations.metadata IS 'Additional data like department, subjects to teach, etc.';

-- ============================================
-- PHASE 3: CREATE PARENT-STUDENT LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link parties
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Relationship type
  relationship TEXT DEFAULT 'parent' 
    CHECK (relationship IN ('father', 'mother', 'parent', 'guardian', 'grandparent', 'other')),
  
  -- Approval workflow
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  
  -- Approval tracking
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  
  -- Permissions (can be customized per link)
  can_view_grades BOOLEAN DEFAULT TRUE,
  can_view_attendance BOOLEAN DEFAULT TRUE,
  can_view_finance BOOLEAN DEFAULT TRUE,
  can_view_schedule BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (parent_id, student_id)
);

-- Indexes for parent links
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_status ON parent_student_links(status);
CREATE INDEX IF NOT EXISTS idx_parent_links_pending ON parent_student_links(status) WHERE status = 'pending';

COMMENT ON TABLE parent_student_links IS 'Links parent accounts to their children with approval workflow';
COMMENT ON COLUMN parent_student_links.status IS 'pending: awaiting staff approval, approved: active link, rejected: denied, revoked: deactivated';

-- ============================================
-- PHASE 4: RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Invitations: Admin/Staff can manage
DROP POLICY IF EXISTS "Admin staff manage invitations" ON user_invitations;
CREATE POLICY "Admin staff manage invitations" ON user_invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin', 'staff')
    )
  );

-- Parent Links: Admin/Staff can manage all, parents can view their own
DROP POLICY IF EXISTS "Admin staff manage parent links" ON parent_student_links;
CREATE POLICY "Admin staff manage parent links" ON parent_student_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('super_admin', 'admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Parents view own links" ON parent_student_links;
CREATE POLICY "Parents view own links" ON parent_student_links
  FOR SELECT TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Students view their parent links
DROP POLICY IF EXISTS "Students view their parent links" ON parent_student_links;
CREATE POLICY "Students view their parent links" ON parent_student_links
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Parents can insert new link requests (pending approval)
DROP POLICY IF EXISTS "Parents can request links" ON parent_student_links;
CREATE POLICY "Parents can request links" ON parent_student_links
  FOR INSERT TO authenticated
  WITH CHECK (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'parent'
    )
    AND status = 'pending'
  );

-- ============================================
-- PHASE 5: HELPER FUNCTIONS
-- ============================================

-- Function to get parent's linked students
CREATE OR REPLACE FUNCTION get_linked_students(parent_profile_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_code TEXT,
  relationship TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psl.student_id,
    p.full_name AS student_name,
    sp.student_code,
    psl.relationship
  FROM parent_student_links psl
  JOIN profiles p ON psl.student_id = p.id
  LEFT JOIN student_profiles sp ON p.id = sp.profile_id
  WHERE psl.parent_id = parent_profile_id
    AND psl.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if parent can access student data
CREATE OR REPLACE FUNCTION can_parent_access_student(
  parent_profile_id UUID, 
  target_student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM parent_student_links
    WHERE parent_id = parent_profile_id
      AND student_id = target_student_id
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count pending parent link requests
CREATE OR REPLACE FUNCTION count_pending_parent_links()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM parent_student_links WHERE status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 6: UPDATE EXISTING PROFILES
-- ============================================

-- Set all existing profiles to 'active' status
UPDATE profiles 
SET account_status = 'active', 
    status_changed_at = NOW()
WHERE account_status IS NULL;

-- ============================================
-- DONE
-- ============================================
SELECT 'Role permission system migration complete!' AS status;
