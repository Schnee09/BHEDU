-- Migration: Add 'staff' role to the role system
-- Date: 2025-12-09
-- Description: Adds staff role for sub-admin/office staff functionality

-- Note: If the role column uses an enum type, you'll need to add the new value
-- If it's just a text column with a check constraint, update the constraint

-- Option 1: If using an enum type (role_type)
-- ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'staff';

-- Option 2: If using a check constraint on the role column
-- First, let's check the current constraint and update it

-- Drop existing check constraint if it exists
DO $$
BEGIN
  -- Only apply changes if the `profiles` table exists in this database.
  IF to_regclass('public.profiles') IS NOT NULL THEN

    -- Drop existing check constraint if it exists
    ALTER TABLE profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

    -- Add new check constraint that includes 'staff'
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);

    -- Update RLS policies to handle staff role
    -- Staff should have similar read access to admin for most tables

    -- Example: Allow staff to read all profiles (like admin)
    DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
    CREATE POLICY "Staff can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
    );

    -- Allow staff to update non-admin profiles
    DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON profiles;
    CREATE POLICY "Staff can update non-admin profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      AND role NOT IN ('admin', 'staff') -- Can't edit admin or staff users
    )
    WITH CHECK (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      AND role NOT IN ('admin', 'staff')
    );

    -- Students table: only apply if the students table exists
    IF to_regclass('public.students') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
      CREATE POLICY "Staff can view all students"
      ON public.students FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

      DROP POLICY IF EXISTS "Staff can manage students" ON public.students;
      CREATE POLICY "Staff can manage students"
      ON public.students FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Classes table
    IF to_regclass('public.classes') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can view all classes" ON classes;
      CREATE POLICY "Staff can view all classes"
      ON classes FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

      DROP POLICY IF EXISTS "Staff can manage classes" ON classes;
      CREATE POLICY "Staff can manage classes"
      ON classes FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Enrollments table
    IF to_regclass('public.enrollments') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can manage enrollments" ON enrollments;
      CREATE POLICY "Staff can manage enrollments"
      ON enrollments FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Attendance table
    IF to_regclass('public.attendance') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can view all attendance" ON attendance;
      CREATE POLICY "Staff can view all attendance"
      ON attendance FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

      DROP POLICY IF EXISTS "Staff can manage attendance" ON attendance;
      CREATE POLICY "Staff can manage attendance"
      ON attendance FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

      DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
      CREATE POLICY "Staff can update attendance"
      ON attendance FOR UPDATE
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Finance tables (student_accounts, invoices, payments)
    IF to_regclass('public.student_accounts') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can manage student accounts" ON student_accounts;
      CREATE POLICY "Staff can manage student accounts"
      ON student_accounts FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    IF to_regclass('public.invoices') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can manage invoices" ON invoices;
      CREATE POLICY "Staff can manage invoices"
      ON invoices FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    IF to_regclass('public.payments') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
      CREATE POLICY "Staff can manage payments"
      ON payments FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Grades table (read only for staff)
    IF to_regclass('public.grades') IS NOT NULL THEN
      DROP POLICY IF EXISTS "Staff can view all grades" ON grades;
      CREATE POLICY "Staff can view all grades"
      ON grades FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
    END IF;

    -- Note: Staff cannot modify grades - only view them
    -- This is intentional per the role matrix

    COMMENT ON COLUMN profiles.role IS 'User role: admin (super admin), staff (sub-admin/office), teacher, student';

  END IF;
END
$$;
