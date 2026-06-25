-- Migration: Update Owner Role default permissions
-- Created: 2026-06-05
-- Purpose: Seed the missing operational permissions for the 'owner' role into the DB.

INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('owner', 'students.create'),
  ('owner', 'students.edit'),
  ('owner', 'students.delete'),
  ('owner', 'students.import'),
  ('owner', 'classes.manage'),
  ('owner', 'classes.create'),
  ('owner', 'classes.edit'),
  ('owner', 'classes.delete'),
  ('owner', 'classes.enroll'),
  ('owner', 'enrollments.manage'),
  ('owner', 'curriculum.manage'),
  ('owner', 'grades.entry'),
  ('owner', 'grades.delete'),
  ('owner', 'timetable.edit'),
  ('owner', 'subjects.manage'),
  ('owner', 'parent_links.approve'),
  ('owner', 'roles.manage'),
  ('owner', 'permissions.manage')
ON CONFLICT (role, permission_code) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
