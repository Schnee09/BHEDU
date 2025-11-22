------------------------------------------------------------
-- 🛠️ Student Management Helper Functions
-- Migration: 046_student_management_functions
-- Date: 2025-11-21
-- Description: Utility functions for student CRUD operations
------------------------------------------------------------

------------------------------------------------------------
-- Function: Check if a record exists in any table
------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_exists(
  table_name text,
  record_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND tables.table_name = record_exists.table_name
  );
END;
$$;

COMMENT ON FUNCTION record_exists IS 
  'Check if a record exists in a given table by ID';

------------------------------------------------------------
-- Function: Check if user is admin
------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_admin IS 
  'Check if a user has admin role (bypasses RLS)';

------------------------------------------------------------
-- Function: Check if user is teacher
------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_teacher(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'teacher'
  );
END;
$$;

COMMENT ON FUNCTION is_teacher IS 
  'Check if a user has teacher role (bypasses RLS)';

------------------------------------------------------------
-- Function: Check if user is student
------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_student(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'student'
  );
END;
$$;

COMMENT ON FUNCTION is_student IS 
  'Check if a user has student role (bypasses RLS)';

------------------------------------------------------------
-- Function: Check if student is enrolled in a class
------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_enrolled_in_class(
  p_class_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM enrollments
    WHERE class_id = p_class_id
    AND student_id = p_student_id
    AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION is_enrolled_in_class IS 
  'Check if a student is actively enrolled in a specific class';

------------------------------------------------------------
-- Function: Check if student has active enrollments
------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_active_enrollments(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM enrollments
    WHERE student_id = p_student_id
    AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION has_active_enrollments IS 
  'Check if a student has any active enrollments';

------------------------------------------------------------
-- Function: Get student enrollment count
------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_student_enrollment_count(p_student_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  enrollment_count integer;
BEGIN
  SELECT COUNT(*)
  INTO enrollment_count
  FROM enrollments
  WHERE student_id = p_student_id
  AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

COMMENT ON FUNCTION get_student_enrollment_count IS 
  'Get count of active enrollments for a student';

------------------------------------------------------------
-- Function: Get class enrollment count
------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_class_enrollment_count(p_class_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  enrollment_count integer;
BEGIN
  SELECT COUNT(*)
  INTO enrollment_count
  FROM enrollments
  WHERE class_id = p_class_id
  AND status = 'active';
  
  RETURN COALESCE(enrollment_count, 0);
END;
$$;

COMMENT ON FUNCTION get_class_enrollment_count IS 
  'Get count of active students enrolled in a class';

------------------------------------------------------------
-- Function: Check if email is unique
------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_email_unique(
  p_email text,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF p_exclude_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM profiles
      WHERE LOWER(email) = LOWER(p_email)
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1
      FROM profiles
      WHERE LOWER(email) = LOWER(p_email)
      AND id != p_exclude_id
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION is_email_unique IS 
  'Check if an email address is unique (case-insensitive)';

------------------------------------------------------------
-- Function: Batch insert helper
------------------------------------------------------------
CREATE OR REPLACE FUNCTION batch_insert_enrollments(
  p_student_ids uuid[],
  p_class_id uuid,
  p_enrollment_date date DEFAULT CURRENT_DATE,
  p_status text DEFAULT 'active'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer := 0;
  student_id uuid;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    -- Only insert if not already enrolled
    IF NOT is_enrolled_in_class(p_class_id, student_id) THEN
      INSERT INTO enrollments (student_id, class_id, enrollment_date, status)
      VALUES (student_id, p_class_id, p_enrollment_date, p_status);
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION batch_insert_enrollments IS 
  'Batch enroll multiple students in a class, skipping duplicates';

------------------------------------------------------------
-- Function: Get student with enrollments (optimized)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_student_with_enrollments(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  full_name text,
  email text,
  date_of_birth date,
  phone text,
  address text,
  emergency_contact text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  enrollment_id uuid,
  class_id uuid,
  class_name text,
  enrollment_date date,
  enrollment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.full_name,
    p.email,
    p.date_of_birth,
    p.phone,
    p.address,
    p.emergency_contact,
    p.role,
    p.created_at,
    p.updated_at,
    e.id as enrollment_id,
    e.class_id,
    c.name as class_name,
    e.enrollment_date,
    e.status as enrollment_status
  FROM profiles p
  LEFT JOIN enrollments e ON e.student_id = p.id AND e.status = 'active'
  LEFT JOIN classes c ON c.id = e.class_id
  WHERE p.id = p_student_id
  AND p.role = 'student';
END;
$$;

COMMENT ON FUNCTION get_student_with_enrollments IS 
  'Get student profile with all active enrollments in a single optimized query';

------------------------------------------------------------
-- Grant execute permissions
------------------------------------------------------------
GRANT EXECUTE ON FUNCTION record_exists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_teacher TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_student TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_enrolled_in_class TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_active_enrollments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_student_enrollment_count TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_class_enrollment_count TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_email_unique TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION batch_insert_enrollments TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_student_with_enrollments TO authenticated, service_role;
