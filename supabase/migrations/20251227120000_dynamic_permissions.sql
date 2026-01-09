-- Migration: Dynamic Permissions System
-- Created: 2025-12-27
-- Purpose: Create tables for dynamic user permissions and audit logging

-- ============================================
-- PHASE 1: FIX PROFILE RLS FIRST
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Teachers can view students in own classes" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles v2" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.profiles;

-- Simple policy: everyone can view their own profile (no role check needed)
CREATE POLICY "Users always view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Staff/Admin can view all profiles
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Teachers can view students in their classes
CREATE POLICY "Teachers view class students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'teacher'
    AND role = 'student'
    AND id IN (
      SELECT e.student_id 
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.teacher_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- ============================================
-- PHASE 2: PERMISSION DEFINITIONS TABLE
-- ============================================

-- Table to define all available permissions
CREATE TABLE IF NOT EXISTS public.permission_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,    -- 'classes', 'students', 'grades', etc.
  action VARCHAR(20) NOT NULL,      -- 'read', 'write', 'delete', 'manage'
  category VARCHAR(50) DEFAULT 'general', -- For grouping in UI
  is_system BOOLEAN DEFAULT false,  -- System permissions cannot be deleted
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT permission_definitions_pkey PRIMARY KEY (id)
);

-- Seed default permissions
INSERT INTO public.permission_definitions (code, name, description, resource, action, category, is_system) VALUES
-- System
('system.settings', 'Cài đặt hệ thống', 'Quản lý cài đặt chung của hệ thống', 'system', 'manage', 'system', true),
('system.audit', 'Xem audit log', 'Xem lịch sử hoạt động hệ thống', 'system', 'read', 'system', true),

-- Users
('users.view', 'Xem người dùng', 'Xem danh sách và thông tin người dùng', 'users', 'read', 'users', true),
('users.create', 'Tạo người dùng', 'Thêm người dùng mới vào hệ thống', 'users', 'write', 'users', true),
('users.edit', 'Sửa người dùng', 'Chỉnh sửa thông tin người dùng', 'users', 'write', 'users', true),
('users.delete', 'Xóa người dùng', 'Xóa người dùng khỏi hệ thống', 'users', 'delete', 'users', true),
('users.permissions', 'Quản lý quyền', 'Cấp và thu hồi quyền cho người dùng', 'users', 'manage', 'users', true),

-- Students
('students.view', 'Xem học sinh', 'Xem danh sách và hồ sơ học sinh', 'students', 'read', 'students', true),
('students.create', 'Thêm học sinh', 'Đăng ký học sinh mới', 'students', 'write', 'students', true),
('students.edit', 'Sửa học sinh', 'Chỉnh sửa thông tin học sinh', 'students', 'write', 'students', true),
('students.delete', 'Xóa học sinh', 'Xóa hồ sơ học sinh', 'students', 'delete', 'students', true),

-- Classes
('classes.view', 'Xem lớp học', 'Xem danh sách lớp học', 'classes', 'read', 'classes', true),
('classes.create', 'Tạo lớp học', 'Tạo lớp học mới', 'classes', 'write', 'classes', true),
('classes.edit', 'Sửa lớp học', 'Chỉnh sửa thông tin lớp', 'classes', 'write', 'classes', true),
('classes.delete', 'Xóa lớp học', 'Xóa lớp học', 'classes', 'delete', 'classes', true),
('classes.enroll', 'Đăng ký lớp', 'Thêm/xóa học sinh vào lớp', 'enrollments', 'manage', 'classes', true),

-- Grades
('grades.view', 'Xem điểm', 'Xem điểm số học sinh', 'grades', 'read', 'grades', true),
('grades.entry', 'Nhập điểm', 'Nhập và sửa điểm học sinh', 'grades', 'write', 'grades', true),
('grades.delete', 'Xóa điểm', 'Xóa điểm đã nhập', 'grades', 'delete', 'grades', true),
('grades.analytics', 'Phân tích điểm', 'Xem báo cáo và phân tích điểm', 'grades', 'read', 'grades', true),

-- Attendance
('attendance.view', 'Xem điểm danh', 'Xem lịch sử điểm danh', 'attendance', 'read', 'attendance', true),
('attendance.mark', 'Điểm danh', 'Thực hiện điểm danh', 'attendance', 'write', 'attendance', true),
('attendance.reports', 'Báo cáo điểm danh', 'Xem báo cáo điểm danh', 'attendance', 'read', 'attendance', true),

-- Finance
('finance.view', 'Xem tài chính', 'Xem thông tin học phí và thanh toán', 'finance', 'read', 'finance', true),
('finance.invoices', 'Quản lý hóa đơn', 'Tạo và quản lý hóa đơn', 'finance', 'manage', 'finance', true),
('finance.payments', 'Quản lý thanh toán', 'Ghi nhận thanh toán', 'finance', 'manage', 'finance', true),

-- Reports
('reports.view', 'Xem báo cáo', 'Xem các báo cáo tổng hợp', 'reports', 'read', 'reports', true),
('reports.export', 'Xuất báo cáo', 'Xuất dữ liệu ra file', 'reports', 'write', 'reports', true)

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PHASE 3: ROLE DEFAULT PERMISSIONS
-- ============================================

-- Default permissions for each role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_unique UNIQUE (role, permission_code),
  CONSTRAINT role_permissions_permission_fkey FOREIGN KEY (permission_code) 
    REFERENCES public.permission_definitions(code) ON DELETE CASCADE
);

-- Admin has all permissions (wildcard, handled in code)
-- Staff permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
('staff', 'users.view'),
('staff', 'users.create'),
('staff', 'users.edit'),
('staff', 'students.view'),
('staff', 'students.create'),
('staff', 'students.edit'),
('staff', 'classes.view'),
('staff', 'classes.create'),
('staff', 'classes.edit'),
('staff', 'classes.enroll'),
('staff', 'grades.view'),
('staff', 'grades.analytics'),
('staff', 'attendance.view'),
('staff', 'attendance.mark'),
('staff', 'attendance.reports'),
('staff', 'finance.view'),
('staff', 'finance.invoices'),
('staff', 'finance.payments'),
('staff', 'reports.view'),
('staff', 'reports.export')
ON CONFLICT DO NOTHING;

-- Teacher permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
('teacher', 'classes.view'),
('teacher', 'students.view'),
('teacher', 'grades.view'),
('teacher', 'grades.entry'),
('teacher', 'grades.analytics'),
('teacher', 'attendance.view'),
('teacher', 'attendance.mark'),
('teacher', 'reports.view')
ON CONFLICT DO NOTHING;

-- Student permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
('student', 'classes.view'),
('student', 'grades.view'),
('student', 'attendance.view')
ON CONFLICT DO NOTHING;

-- ============================================
-- PHASE 4: USER CUSTOM PERMISSIONS
-- ============================================

-- Custom permissions granted to specific users (overrides role defaults)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  granted_by uuid NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,             -- Optional expiration
  is_denied BOOLEAN DEFAULT false,    -- true = explicitly deny, false = grant
  notes TEXT,
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_unique UNIQUE (user_id, permission_code),
  CONSTRAINT user_permissions_user_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_permissions_granter_fkey FOREIGN KEY (granted_by) 
    REFERENCES public.profiles(id),
  CONSTRAINT user_permissions_permission_fkey FOREIGN KEY (permission_code) 
    REFERENCES public.permission_definitions(code) ON DELETE CASCADE
);

CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);

-- ============================================
-- PHASE 5: PERMISSION AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.permission_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action VARCHAR(20) NOT NULL,        -- 'grant', 'revoke', 'deny'
  user_id uuid NOT NULL,              -- User whose permissions changed
  permission_code VARCHAR(100) NOT NULL,
  performed_by uuid NOT NULL,         -- Admin who made the change
  old_value JSONB,                    -- Previous state
  new_value JSONB,                    -- New state
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT permission_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT permission_audit_logs_user_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT permission_audit_logs_performer_fkey FOREIGN KEY (performed_by) 
    REFERENCES public.profiles(id)
);

CREATE INDEX idx_permission_audit_user ON public.permission_audit_logs(user_id);
CREATE INDEX idx_permission_audit_date ON public.permission_audit_logs(created_at);

-- ============================================
-- PHASE 6: HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_permission_code VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR(20);
  v_has_permission BOOLEAN := false;
  v_is_denied BOOLEAN := false;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  -- Admin has all permissions
  IF v_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check if explicitly denied for this user
  SELECT is_denied INTO v_is_denied
  FROM public.user_permissions
  WHERE user_id = p_user_id 
    AND permission_code = p_permission_code
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_is_denied = true THEN
    RETURN false;
  END IF;
  
  -- Check custom user permission
  SELECT true INTO v_has_permission
  FROM public.user_permissions
  WHERE user_id = p_user_id 
    AND permission_code = p_permission_code
    AND is_denied = false
    AND (expires_at IS NULL OR expires_at > now());
  
  IF v_has_permission THEN
    RETURN true;
  END IF;
  
  -- Check role default permission
  SELECT true INTO v_has_permission
  FROM public.role_permissions
  WHERE role = v_role 
    AND permission_code = p_permission_code;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission_code VARCHAR(100), source VARCHAR(20)) AS $$
DECLARE
  v_role VARCHAR(20);
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  -- Admin has all permissions
  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT pd.code, 'admin'::VARCHAR(20)
    FROM public.permission_definitions pd;
    RETURN;
  END IF;
  
  -- Return role permissions
  RETURN QUERY
  SELECT rp.permission_code, 'role'::VARCHAR(20)
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  
  -- Add custom user permissions (not denied)
  RETURN QUERY
  SELECT up.permission_code, 'custom'::VARCHAR(20)
  FROM public.user_permissions up
  WHERE up.user_id = p_user_id
    AND up.is_denied = false
    AND (up.expires_at IS NULL OR up.expires_at > now())
    AND up.permission_code NOT IN (
      SELECT rp.permission_code FROM public.role_permissions rp WHERE rp.role = v_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 7: RLS FOR NEW TABLES
-- ============================================

ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can view permission definitions
CREATE POLICY "Anyone can view permissions"
  ON public.permission_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can modify
CREATE POLICY "Admin manage permission definitions"
  ON public.permission_definitions FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Anyone can view role permissions
CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can modify role permissions
CREATE POLICY "Admin manage role permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Users can view their own custom permissions
CREATE POLICY "Users view own custom permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR public.get_current_user_role() = 'admin'
  );

-- Only admin can manage custom permissions
CREATE POLICY "Admin manage custom permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Admin can view audit logs
CREATE POLICY "Admin view audit logs"
  ON public.permission_audit_logs FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- System inserts audit logs (via function)
CREATE POLICY "System insert audit logs"
  ON public.permission_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- DONE
-- ============================================
NOTIFY pgrst, 'reload schema';
SELECT 'Dynamic permissions system created!' AS status;
