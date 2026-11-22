-- Add a dedicated permission for destructive curriculum operations.
-- Creating and editing remain under curriculum.manage.

INSERT INTO public.permission_definitions
  (code, name, description, resource, action, category, is_system)
VALUES
  (
    'curriculum.delete',
    'Xóa nội dung chương trình học',
    'Xóa chuẩn kiến thức hoặc nội dung chương trình không còn sử dụng',
    'curriculum',
    'delete',
    'curriculum',
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
  ('owner', 'curriculum.delete'),
  ('admin', 'curriculum.delete')
ON CONFLICT (role, permission_code) DO NOTHING;
