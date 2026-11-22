-- Separate center-wide dashboard analytics from personal report access.

INSERT INTO public.permission_definitions
  (code, name, description, resource, action, category, is_system)
VALUES
  (
    'reports.center_view',
    'Xem tổng quan trung tâm',
    'Xem các chỉ số tổng hợp về học sinh, lớp học và hoạt động của trung tâm',
    'reports',
    'read',
    'reports',
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

INSERT INTO public.role_permissions (role, permission_code)
VALUES
  ('owner', 'reports.center_view'),
  ('admin', 'reports.center_view')
ON CONFLICT (role, permission_code) DO NOTHING;
