-- Add dedicated permissions for calendar operations.

INSERT INTO public.permission_definitions
  (code, name, description, resource, action, category, is_system)
VALUES
  (
    'calendar.manage',
    'Quản lý lịch trung tâm',
    'Tạo, cập nhật và xóa các sự kiện trên lịch trung tâm',
    'calendar',
    'manage',
    'calendar',
    true
  ),
  (
    'calendar.reset',
    'Khôi phục lịch mặc định',
    'Thay thế lịch hiện tại bằng các mốc mặc định của năm học',
    'calendar',
    'reset',
    'calendar',
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
  ('owner', 'calendar.manage'),
  ('owner', 'calendar.reset'),
  ('admin', 'calendar.manage'),
  ('admin', 'calendar.reset'),
  ('staff', 'calendar.manage'),
  ('teacher', 'calendar.manage')
ON CONFLICT (role, permission_code) DO NOTHING;
