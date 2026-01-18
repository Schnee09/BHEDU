-- Migration: Update Staff Permissions
-- Created: 2026-01-17
-- Purpose: Grant additional permissions to Staff role (delete operations and grade entry)

-- Insert new permissions for staff
INSERT INTO public.role_permissions (role, permission_code) VALUES
('staff', 'grades.entry'),    -- Allow staff to enter/edit grades
('staff', 'users.delete'),    -- Allow staff to delete users (soft delete/deactivate)
('staff', 'students.delete'), -- Allow staff to delete students
('staff', 'classes.delete')   -- Allow staff to delete classes
ON CONFLICT (role, permission_code) DO NOTHING;

-- Log the migration
SELECT 'Staff permissions updated successfully' AS status;
