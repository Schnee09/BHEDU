-- Separate center-wide timetable access from personal timetable access.

INSERT INTO public.permission_definitions
  (code, name, description, resource, action, category, is_system)
VALUES
  (
    'timetable.view_all',
    'Xem toàn bộ thời khóa biểu',
    'Xem lịch của tất cả lớp học, giáo viên và học sinh trong trung tâm',
    'timetable',
    'read_all',
    'timetable',
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
  ('owner', 'timetable.view_all'),
  ('admin', 'timetable.view_all')
ON CONFLICT (role, permission_code) DO NOTHING;
