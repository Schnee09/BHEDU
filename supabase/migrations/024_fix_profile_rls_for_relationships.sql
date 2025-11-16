-- Migration: Fix RLS policies to allow reading profiles in attendance/grades contexts
-- Date: 2025-11-16
-- Issue: Teachers/admins can't read student profiles through attendance/grades relationship queries

------------------------------------------------------------
-- Allow teachers to read profiles of students in their classes
------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers read student profiles" ON profiles;
CREATE POLICY "Teachers read student profiles"
  ON profiles FOR SELECT
  USING (
    role = 'student' AND EXISTS (
      SELECT 1 FROM enrollments e
      INNER JOIN classes c ON e.class_id = c.id
      WHERE e.student_id = profiles.id
        AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- Allow admins to read all profiles
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

------------------------------------------------------------
-- Allow reading teacher profiles for class displays
------------------------------------------------------------
DROP POLICY IF EXISTS "Read teacher profiles" ON profiles;
CREATE POLICY "Read teacher profiles"
  ON profiles FOR SELECT
  USING (role IN ('teacher', 'admin'));

------------------------------------------------------------
-- Update attendance policies to ensure proper access
------------------------------------------------------------
-- Teachers can read attendance for their classes
DROP POLICY IF EXISTS "Teachers read attendance" ON attendance;
CREATE POLICY "Teachers read attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = attendance.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Students can read their own attendance
DROP POLICY IF EXISTS "Students read own attendance" ON attendance;
CREATE POLICY "Students read own attendance"
  ON attendance FOR SELECT
  USING (student_id = auth.uid());

-- Admins can read all attendance
DROP POLICY IF EXISTS "Admins read all attendance" ON attendance;
CREATE POLICY "Admins read all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
