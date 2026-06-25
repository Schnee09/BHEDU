-- Migration: Owner Role Rework & Configurable RBAC
-- Created: 2026-06-05
-- Purpose: 
--   1. Create role_permission_overrides table for Super Admin to customize role defaults
--   2. Add scope column to permission_audit_logs to distinguish role vs user changes
--   3. Seed Owner role permissions into role_permissions for UI display
--   4. Update DB helper functions to 3-layer resolution
--   5. Fix RLS policies to include 'owner' role alongside 'admin'

-- ============================================
-- PHASE 1: ADD MISSING PERMISSION DEFINITIONS
-- ============================================

-- Add any permission codes used in core.ts that aren't in permission_definitions yet
INSERT INTO public.permission_definitions (code, name, description, resource, action, category, is_system) VALUES
  ('grades.manage',       'Quản lý điểm số',         'Xem và quản lý toàn bộ điểm số trong trung tâm',     'grades',       'manage', 'grades',      true),
  ('attendance.manage',   'Quản lý điểm danh',        'Xem và quản lý toàn bộ điểm danh trong trung tâm',   'attendance',   'manage', 'attendance',  true),
  ('attendance.reports',  'Báo cáo điểm danh',        'Xem báo cáo điểm danh tổng hợp',                    'attendance',   'read',   'attendance',  true),
  ('finance.manage',      'Quản lý tài chính',        'Quản lý thu chi và học phí',                         'finance',      'manage', 'finance',     true),
  ('finance.refund',      'Hoàn trả học phí',         'Phê duyệt hoàn trả học phí',                         'finance',      'manage', 'finance',     true),
  ('finance.export',      'Xuất dữ liệu tài chính',   'Xuất báo cáo tài chính ra file',                     'finance',      'read',   'finance',     true),
  ('curriculum.view',     'Xem chương trình học',     'Xem nội dung chương trình giảng dạy',                'curriculum',   'read',   'curriculum',  true),
  ('curriculum.manage',   'Quản lý chương trình học', 'Tạo và sửa chương trình giảng dạy',                  'curriculum',   'manage', 'curriculum',  true),
  ('enrollments.view',    'Xem đăng ký học',          'Xem danh sách đăng ký lớp học',                      'enrollments',  'read',   'enrollments', true),
  ('enrollments.manage',  'Quản lý đăng ký học',      'Thêm/xóa đăng ký lớp học',                          'enrollments',  'manage', 'enrollments', true),
  ('subjects.view',       'Xem môn học',              'Xem danh sách môn học',                              'subjects',     'read',   'subjects',    true),
  ('subjects.manage',     'Quản lý môn học',          'Tạo và sửa môn học',                                 'subjects',     'manage', 'subjects',    true),
  ('timetable.view',      'Xem thời khóa biểu',       'Xem thời khóa biểu lớp học',                        'timetable',    'read',   'timetable',   true),
  ('timetable.edit',      'Sửa thời khóa biểu',       'Tạo và chỉnh sửa thời khóa biểu',                   'timetable',    'manage', 'timetable',   true),
  ('announcements.manage','Quản lý thông báo',        'Tạo và quản lý thông báo toàn trung tâm',            'announcements','manage', 'announcements',true),
  ('roles.view',          'Xem vai trò',              'Xem danh sách vai trò và quyền hạn',                 'roles',        'read',   'roles',       true),
  ('roles.manage',        'Quản lý vai trò',          'Cấu hình quyền cho từng vai trò',                    'roles',        'manage', 'roles',       true),
  ('permissions.manage',  'Quản lý quyền hạn',        'Cấp và thu hồi quyền cho người dùng',               'permissions',  'manage', 'permissions', true),
  ('parent_links.view',   'Xem liên kết phụ huynh',   'Xem danh sách liên kết phụ huynh - học sinh',       'parent_links', 'read',   'users',       true),
  ('parent_links.approve','Duyệt liên kết phụ huynh', 'Phê duyệt yêu cầu liên kết phụ huynh',             'parent_links', 'manage', 'users',       true),
  ('users.delete.soft',   'Vô hiệu hóa người dùng',  'Vô hiệu hóa tài khoản (không xóa vĩnh viễn)',       'users',        'delete', 'users',       true),
  ('users.delete.hard',   'Xóa người dùng vĩnh viễn','Xóa vĩnh viễn tài khoản khỏi hệ thống',            'users',        'delete', 'users',       true),
  ('users.invite',        'Mời người dùng',           'Gửi email mời người dùng tham gia hệ thống',         'users',        'manage', 'users',       true),
  ('users.bulk_import',   'Nhập hàng loạt',           'Nhập danh sách người dùng từ file Excel/CSV',        'users',        'manage', 'users',       true),
  ('students.import',     'Nhập học sinh hàng loạt',  'Nhập danh sách học sinh từ file',                   'students',     'manage', 'students',    true),
  ('classes.manage',      'Quản lý lớp học',          'Toàn quyền quản lý lớp học',                         'classes',      'manage', 'classes',     true),
  ('tutoring.sessions.view',   'Xem buổi kèm riêng',  'Xem danh sách buổi học kèm riêng',                 'tutoring',     'read',   'tutoring',    true),
  ('tutoring.sessions.manage', 'Quản lý buổi kèm',    'Tạo và quản lý buổi học kèm riêng',                'tutoring',     'manage', 'tutoring',    true),
  ('tutoring.feedback.submit', 'Gửi nhận xét kèm',    'Gửi nhận xét sau buổi kèm riêng',                  'tutoring',     'write',  'tutoring',    true),
  ('parent.view_students', 'Xem thông tin con',       'Phụ huynh xem thông tin học sinh của mình',          'parent',       'read',   'parent',      true),
  ('parent.link_student',  'Liên kết với con',        'Phụ huynh yêu cầu liên kết với học sinh',           'parent',       'manage', 'parent',      true),
  ('grades.analytics',    'Phân tích điểm số',        'Xem báo cáo thống kê và phân tích điểm số',         'grades',       'read',   'grades',      true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PHASE 2: SEED OWNER ROLE PERMISSIONS
-- ============================================

-- Clear old owner permissions and re-seed to match the new standalone definition
DELETE FROM public.role_permissions WHERE role = 'owner';

INSERT INTO public.role_permissions (role, permission_code) VALUES
  -- Visibility
  ('owner', 'users.view'),
  ('owner', 'students.view'),
  ('owner', 'classes.view'),
  ('owner', 'timetable.view'),
  ('owner', 'grades.view'),
  ('owner', 'grades.analytics'),
  ('owner', 'grades.manage'),
  ('owner', 'attendance.view'),
  ('owner', 'attendance.reports'),
  ('owner', 'enrollments.view'),
  ('owner', 'curriculum.view'),
  ('owner', 'subjects.view'),
  -- Finance
  ('owner', 'finance.view'),
  ('owner', 'finance.manage'),
  ('owner', 'finance.refund'),
  ('owner', 'finance.export'),
  -- Reports
  ('owner', 'reports.view'),
  ('owner', 'reports.export'),
  -- Announcements
  ('owner', 'announcements.manage'),
  -- Staff management
  ('owner', 'users.create'),
  ('owner', 'users.edit'),
  ('owner', 'users.delete.soft'),
  ('owner', 'users.invite'),
  ('owner', 'users.bulk_import'),
  -- Oversight
  ('owner', 'roles.view'),
  ('owner', 'parent_links.view')
ON CONFLICT DO NOTHING;

-- Also seed Admin role permissions into role_permissions for UI display
DELETE FROM public.role_permissions WHERE role = 'admin';

INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('admin', 'users.view'),
  ('admin', 'users.create'),
  ('admin', 'users.edit'),
  ('admin', 'users.delete.soft'),
  ('admin', 'users.invite'),
  ('admin', 'users.bulk_import'),
  ('admin', 'parent_links.view'),
  ('admin', 'parent_links.approve'),
  ('admin', 'students.view'),
  ('admin', 'students.create'),
  ('admin', 'students.edit'),
  ('admin', 'students.delete'),
  ('admin', 'classes.manage'),
  ('admin', 'classes.view'),
  ('admin', 'classes.create'),
  ('admin', 'classes.edit'),
  ('admin', 'classes.delete'),
  ('admin', 'classes.enroll'),
  ('admin', 'enrollments.view'),
  ('admin', 'enrollments.manage'),
  ('admin', 'curriculum.manage'),
  ('admin', 'grades.view'),
  ('admin', 'grades.entry'),
  ('admin', 'grades.manage'),
  ('admin', 'announcements.manage'),
  ('admin', 'finance.view'),
  ('admin', 'finance.manage'),
  ('admin', 'finance.refund'),
  ('admin', 'subjects.view'),
  ('admin', 'subjects.manage'),
  ('admin', 'reports.view'),
  ('admin', 'reports.export'),
  ('admin', 'roles.view'),
  ('admin', 'permissions.manage'),
  ('admin', 'timetable.view'),
  ('admin', 'timetable.edit')
ON CONFLICT DO NOTHING;

-- ============================================
-- PHASE 3: ROLE_PERMISSION_OVERRIDES TABLE
-- ============================================
-- Allows Super Admin to override role defaults (additive or subtractive)
-- without modifying the code-level BASE_ROLE_PERMISSIONS

CREATE TABLE IF NOT EXISTS public.role_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_code TEXT NOT NULL REFERENCES public.permission_definitions(code) ON DELETE CASCADE,
  is_denied BOOLEAN NOT NULL DEFAULT false, -- false = grant extra, true = deny/remove
  granted_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_perm_overrides_role ON public.role_permission_overrides(role);
CREATE INDEX IF NOT EXISTS idx_role_perm_overrides_code ON public.role_permission_overrides(permission_code);

COMMENT ON TABLE public.role_permission_overrides IS 
  'Super Admin configured overrides on top of code-defined role defaults. is_denied=false adds a permission, is_denied=true removes one.';

-- RLS
ALTER TABLE public.role_permission_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ role overrides (needed for client-side hook)
DROP POLICY IF EXISTS "Authenticated can read role overrides" ON public.role_permission_overrides;
CREATE POLICY "Authenticated can read role overrides" ON public.role_permission_overrides
  FOR SELECT TO authenticated
  USING (true);

-- Only super_admin can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Super admin manages role overrides" ON public.role_permission_overrides;
CREATE POLICY "Super admin manages role overrides" ON public.role_permission_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- PHASE 4: ADD SCOPE TO PERMISSION AUDIT LOGS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_audit_logs' AND column_name = 'scope'
  ) THEN
    ALTER TABLE public.permission_audit_logs
      ADD COLUMN scope TEXT DEFAULT 'user' CHECK (scope IN ('user', 'role'));
    RAISE NOTICE 'Added scope column to permission_audit_logs';
  END IF;
END $$;

-- ============================================
-- PHASE 5: UPDATE RLS POLICIES TO INCLUDE OWNER
-- ============================================

-- user_permissions: Owner can also manage custom permissions (for their staff)
DROP POLICY IF EXISTS "Admin manage custom permissions" ON public.user_permissions;
CREATE POLICY "Admin owner manage custom permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Users view own custom permissions" ON public.user_permissions;
CREATE POLICY "Users view own custom permissions v2" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  );

-- permission_audit_logs: Owner can VIEW (for oversight), super_admin can manage
DROP POLICY IF EXISTS "Admin view audit logs" ON public.permission_audit_logs;
CREATE POLICY "Admin owner view audit logs" ON public.permission_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  );

-- ============================================
-- PHASE 6: UPDATE 3-LAYER RESOLVER FUNCTION
-- ============================================

-- Updated user_has_permission: checks user overrides → role overrides → code defaults (via role_permissions)
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_user_is_denied BOOLEAN;
  v_user_is_granted BOOLEAN;
  v_role_is_denied BOOLEAN;
  v_role_is_granted BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  -- super_admin has everything
  IF v_role = 'super_admin' THEN RETURN true; END IF;

  -- ── Layer 1: User-level overrides (highest priority) ──
  SELECT is_denied, NOT is_denied
  INTO v_user_is_denied, v_user_is_granted
  FROM public.user_permissions
  WHERE user_id = p_user_id
    AND permission_code = p_permission_code
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_user_is_denied IS TRUE THEN RETURN false; END IF;
  IF v_user_is_granted IS TRUE THEN RETURN true; END IF;

  -- ── Layer 2: Role-level DB overrides (mid priority) ──
  SELECT is_denied, NOT is_denied
  INTO v_role_is_denied, v_role_is_granted
  FROM public.role_permission_overrides
  WHERE role = v_role
    AND permission_code = p_permission_code
  LIMIT 1;

  IF v_role_is_denied IS TRUE THEN RETURN false; END IF;
  IF v_role_is_granted IS TRUE THEN RETURN true; END IF;

  -- ── Layer 3: Code defaults via role_permissions table ──
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND permission_code = p_permission_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE
-- ============================================

NOTIFY pgrst, 'reload schema';
SELECT 'Owner role rework migration complete!' AS status;
