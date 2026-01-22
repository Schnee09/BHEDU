-- Allow staff to work as teachers
-- Updates RLS policies to let staff members be assigned to classes as teachers

-- Staff with assigned classes should be able to:
-- 1. See their assigned classes
-- 2. Manage grades for those classes
-- 3. Manage attendance for those classes

-- Update classes policy: Staff can manage classes they are assigned to as teacher
DROP POLICY IF EXISTS "Staff can manage assigned classes" ON classes;
CREATE POLICY "Staff can manage assigned classes" ON classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'staff'
      AND classes.teacher_id = profiles.id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Update grades policy: Staff can manage grades for their assigned classes
DROP POLICY IF EXISTS "Staff teachers can manage grades" ON grades;
CREATE POLICY "Staff teachers can manage grades" ON grades
  FOR ALL
  USING (
    -- Staff can manage grades for classes they teach
    EXISTS (
      SELECT 1 FROM classes c
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE c.id = grades.class_id
      AND c.teacher_id = p.id
      AND p.role = 'staff'
    )
    OR
    -- Admin/staff can view all grades
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Update attendance policy: Staff can manage attendance for their assigned classes
DROP POLICY IF EXISTS "Staff teachers can manage attendance" ON attendance;
CREATE POLICY "Staff teachers can manage attendance" ON attendance
  FOR ALL
  USING (
    -- Staff can manage attendance for classes they teach
    (
      SELECT EXISTS (
        SELECT 1 FROM classes c
        JOIN profiles p ON p.user_id = auth.uid()
        WHERE c.id = attendance.class_id
        AND c.teacher_id = p.id
        AND p.role = 'staff'
      )
    )
    OR
    -- Admin/staff can view all attendance
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Comment
COMMENT ON POLICY "Staff can manage assigned classes" ON classes IS 
  'Staff members assigned as teacher_id can manage those classes like regular teachers';
