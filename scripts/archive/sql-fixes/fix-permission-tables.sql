-- Fix Permission Tables - Safe to run multiple times
-- This creates missing tables without failing on existing objects

-- 1. Create permission_definitions if not exists
CREATE TABLE IF NOT EXISTS public.permission_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT permission_definitions_pkey PRIMARY KEY (id)
);

-- Add unique constraint if not exists
DO $$ BEGIN
  ALTER TABLE public.permission_definitions ADD CONSTRAINT permission_definitions_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create role_permissions if not exists
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id)
);

-- Add unique constraint if not exists
DO $$ BEGIN
  ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_unique UNIQUE (role, permission_code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create user_permissions if not exists
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  granted_by uuid,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_denied BOOLEAN DEFAULT false,
  notes TEXT,
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id)
);

-- Add unique constraint if not exists
DO $$ BEGIN
  ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_unique UNIQUE (user_id, permission_code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign key if not exists
DO $$ BEGIN
  ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create permission_audit_logs if not exists
CREATE TABLE IF NOT EXISTS public.permission_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action VARCHAR(20) NOT NULL,
  user_id uuid NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  performed_by uuid,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT permission_audit_logs_pkey PRIMARY KEY (id)
);

-- 5. Seed permission definitions (skip if exists)
INSERT INTO public.permission_definitions (code, name, description, resource, action, category, is_system) VALUES
('system.settings', 'Cài đặt hệ thống', 'Quản lý cài đặt chung', 'system', 'manage', 'system', true),
('system.audit', 'Xem audit log', 'Xem lịch sử hoạt động', 'system', 'read', 'system', true),
('users.view', 'Xem người dùng', 'Xem danh sách người dùng', 'users', 'read', 'users', true),
('users.create', 'Tạo người dùng', 'Thêm người dùng mới', 'users', 'write', 'users', true),
('users.edit', 'Sửa người dùng', 'Chỉnh sửa người dùng', 'users', 'write', 'users', true),
('users.delete', 'Xóa người dùng', 'Xóa người dùng', 'users', 'delete', 'users', true),
('users.permissions', 'Quản lý quyền', 'Cấp/thu hồi quyền', 'users', 'manage', 'users', true),
('students.view', 'Xem học sinh', 'Xem danh sách học sinh', 'students', 'read', 'students', true),
('students.create', 'Thêm học sinh', 'Đăng ký học sinh mới', 'students', 'write', 'students', true),
('students.edit', 'Sửa học sinh', 'Chỉnh sửa thông tin', 'students', 'write', 'students', true),
('students.delete', 'Xóa học sinh', 'Xóa hồ sơ học sinh', 'students', 'delete', 'students', true),
('classes.view', 'Xem lớp học', 'Xem danh sách lớp', 'classes', 'read', 'classes', true),
('classes.create', 'Tạo lớp học', 'Tạo lớp mới', 'classes', 'write', 'classes', true),
('classes.edit', 'Sửa lớp học', 'Chỉnh sửa lớp', 'classes', 'write', 'classes', true),
('classes.delete', 'Xóa lớp học', 'Xóa lớp', 'classes', 'delete', 'classes', true),
('classes.enroll', 'Đăng ký lớp', 'Thêm/xóa học sinh', 'enrollments', 'manage', 'classes', true),
('grades.view', 'Xem điểm', 'Xem điểm số', 'grades', 'read', 'grades', true),
('grades.entry', 'Nhập điểm', 'Nhập và sửa điểm', 'grades', 'write', 'grades', true),
('grades.delete', 'Xóa điểm', 'Xóa điểm đã nhập', 'grades', 'delete', 'grades', true),
('grades.analytics', 'Phân tích điểm', 'Xem báo cáo điểm', 'grades', 'read', 'grades', true),
('attendance.view', 'Xem điểm danh', 'Xem lịch sử', 'attendance', 'read', 'attendance', true),
('attendance.mark', 'Điểm danh', 'Thực hiện điểm danh', 'attendance', 'write', 'attendance', true),
('attendance.reports', 'Báo cáo điểm danh', 'Xem báo cáo', 'attendance', 'read', 'attendance', true),
('finance.view', 'Xem tài chính', 'Xem học phí', 'finance', 'read', 'finance', true),
('finance.invoices', 'Quản lý hóa đơn', 'Tạo hóa đơn', 'finance', 'manage', 'finance', true),
('finance.payments', 'Quản lý thanh toán', 'Ghi nhận thanh toán', 'finance', 'manage', 'finance', true),
('reports.view', 'Xem báo cáo', 'Xem báo cáo tổng hợp', 'reports', 'read', 'reports', true),
('reports.export', 'Xuất báo cáo', 'Xuất dữ liệu', 'reports', 'write', 'reports', true)
ON CONFLICT (code) DO NOTHING;

-- 6. Seed role permissions (skip if exists)
INSERT INTO public.role_permissions (role, permission_code) VALUES
('staff', 'users.view'), ('staff', 'users.create'), ('staff', 'users.edit'),
('staff', 'students.view'), ('staff', 'students.create'), ('staff', 'students.edit'),
('staff', 'classes.view'), ('staff', 'classes.create'), ('staff', 'classes.edit'), ('staff', 'classes.enroll'),
('staff', 'grades.view'), ('staff', 'grades.analytics'),
('staff', 'attendance.view'), ('staff', 'attendance.mark'), ('staff', 'attendance.reports'),
('staff', 'finance.view'), ('staff', 'finance.invoices'), ('staff', 'finance.payments'),
('staff', 'reports.view'), ('staff', 'reports.export'),
('teacher', 'classes.view'), ('teacher', 'students.view'),
('teacher', 'grades.view'), ('teacher', 'grades.entry'), ('teacher', 'grades.analytics'),
('teacher', 'attendance.view'), ('teacher', 'attendance.mark'),
('teacher', 'reports.view'),
('student', 'classes.view'), ('student', 'grades.view'), ('student', 'attendance.view')
ON CONFLICT DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. Simple RLS policies (allow all for now, refine later)
DROP POLICY IF EXISTS "Allow all access to permission_definitions" ON public.permission_definitions;
CREATE POLICY "Allow all access to permission_definitions" ON public.permission_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to role_permissions" ON public.role_permissions;
CREATE POLICY "Allow all access to role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to user_permissions" ON public.user_permissions;
CREATE POLICY "Allow all access to user_permissions" ON public.user_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to permission_audit_logs" ON public.permission_audit_logs;
CREATE POLICY "Allow all access to permission_audit_logs" ON public.permission_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Done!
SELECT 'Permission tables created/fixed successfully!' AS status;
