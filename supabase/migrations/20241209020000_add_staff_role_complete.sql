-- 4-ROLE SYSTEM SETUP: Complete SQL Script (sanitized for db push)
-- Date: 2025-12-09
-- This migration updates the role constraint and installs RLS policies
-- for the 'staff' role. It avoids non-standard statements and guards
-- changes that reference tables that may not exist in all environments.

-- PART 1: Update role constraint
ALTER TABLE IF EXISTS profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add constraint only if it does not already exist (avoid using IF NOT EXISTS which may
-- not be supported on all Postgres versions used by Supabase).
DO $$
BEGIN
  -- Only try to add the constraint if the profiles table actually exists.
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'profiles' AND con.conname = 'profiles_role_check'
    ) THEN
      EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (''admin'', ''staff'', ''teacher'', ''student'') OR role IS NULL)';
    END IF;
  END IF;
END
$$;


-- PART 2: RLS policies (guarded where tables may not exist)
-- Profiles policies
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
    CREATE POLICY "Staff can view all profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

    DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON public.profiles;
    CREATE POLICY "Staff can update non-admin profiles"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
        AND role NOT IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
        AND role NOT IN ('admin', 'staff')
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'COMMENT ON COLUMN public.profiles.role IS ''User role: admin (super admin), staff (sub-admin/office), teacher, student''';
  END IF;
END
$$;
DO $$
BEGIN
  IF to_regclass('public.students') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
    CREATE POLICY "Staff can view all students"
      ON public.students FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

    DROP POLICY IF EXISTS "Staff can manage students" ON public.students;
    CREATE POLICY "Staff can manage students"
      ON public.students FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;
END
$$;

-- Additional tables (classes, enrollments, attendance, finance, grades)
DO $$
BEGIN
  IF to_regclass('public.classes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;
    CREATE POLICY "Staff can view all classes"
      ON public.classes FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

    DROP POLICY IF EXISTS "Staff can manage classes" ON public.classes;
    CREATE POLICY "Staff can manage classes"
      ON public.classes FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.enrollments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can manage enrollments" ON public.enrollments;
    CREATE POLICY "Staff can manage enrollments"
      ON public.enrollments FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.attendance') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
    CREATE POLICY "Staff can view all attendance"
      ON public.attendance FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

    DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;
    CREATE POLICY "Staff can manage attendance"
      ON public.attendance FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );

    DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance;
    CREATE POLICY "Staff can update attendance"
      ON public.attendance FOR UPDATE
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.student_accounts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can manage student accounts" ON public.student_accounts;
    CREATE POLICY "Staff can manage student accounts"
      ON public.student_accounts FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;
    CREATE POLICY "Staff can manage invoices"
      ON public.invoices FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
    CREATE POLICY "Staff can manage payments"
      ON public.payments FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;

  IF to_regclass('public.grades') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff can view all grades" ON public.grades;
    CREATE POLICY "Staff can view all grades"
      ON public.grades FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'staff')
      );
  END IF;
END
$$;

-- Migration sanitized: removed non-standard PRINT statements and guarded table-specific policy changes.
