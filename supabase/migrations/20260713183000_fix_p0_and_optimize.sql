-- Migration: Fix P0 Database issues (conduct_grades View & user_activity_logs Table) and Performance Indexes

-- ============================================
-- 1. FIX P0 ISSUES: conduct_grades
-- ============================================
-- Create conduct_grades View mapping student_conducts to expected next.js columns
CREATE OR REPLACE VIEW public.conduct_grades AS
SELECT
  id,
  student_id,
  academic_year_id,
  term AS semester,
  rating AS conduct_grade,
  comments,
  evaluated_by,
  evaluated_at,
  created_at,
  updated_at
FROM public.student_conducts;

-- Grant select privilege on View
GRANT SELECT ON public.conduct_grades TO authenticated;
GRANT ALL PRIVILEGES ON public.conduct_grades TO service_role;
GRANT ALL PRIVILEGES ON public.conduct_grades TO postgres;

-- ============================================
-- 2. FIX P0 ISSUES: user_activity_logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action CHARACTER VARYING NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_activity_logs
DROP POLICY IF EXISTS "Allow admins and owners to manage user activity logs" ON public.user_activity_logs;
CREATE POLICY "Allow admins and owners to manage user activity logs" ON public.user_activity_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Allow users to view their own activity logs" ON public.user_activity_logs;
CREATE POLICY "Allow users to view their own activity logs" ON public.user_activity_logs
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Grants
GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;
GRANT ALL PRIVILEGES ON public.user_activity_logs TO service_role;
GRANT ALL PRIVILEGES ON public.user_activity_logs TO postgres;

-- ============================================
-- 3. UNIQUE CONSTRAINTS (P1)
-- ============================================
-- Avoid duplicate enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_class_key;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_class_key UNIQUE (student_id, class_id);

-- Avoid duplicate attendance records per class/day/slot
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_class_date_slot_key;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_class_date_slot_key UNIQUE (student_id, class_id, date, timetable_slot_id);

-- Avoid duplicate role permissions
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_permission_code_key;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_permission_code_key UNIQUE (role, permission_code);

-- Avoid duplicate user permissions
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_permission_code_key;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_permission_code_key UNIQUE (user_id, permission_code);

-- Avoid duplicate teacher subjects
ALTER TABLE public.teacher_subjects DROP CONSTRAINT IF EXISTS teacher_subjects_profile_subject_key;
ALTER TABLE public.teacher_subjects ADD CONSTRAINT teacher_subjects_profile_subject_key UNIQUE (profile_id, subject_id);

-- Avoid duplicate student accounts per academic year
ALTER TABLE public.student_accounts DROP CONSTRAINT IF EXISTS student_accounts_student_year_key;
ALTER TABLE public.student_accounts ADD CONSTRAINT student_accounts_student_year_key UNIQUE (student_id, academic_year_id);

-- Avoid duplicate fee assignments
ALTER TABLE public.fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_year_type_class_key;
ALTER TABLE public.fee_assignments ADD CONSTRAINT fee_assignments_year_type_class_key UNIQUE (academic_year_id, fee_type_id, class_id);

-- ============================================
-- 4. PERFORMANCE INDEXES (P1)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code) WHERE student_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_code ON public.profiles(teacher_code) WHERE teacher_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_composite ON public.grades(student_id, class_id, component_type);

CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON public.timetable_slots(class_id, day_of_week) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_day ON public.timetable_slots(teacher_id, day_of_week) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timetable_student_day ON public.timetable_slots(student_id, day_of_week) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON public.classes(academic_year_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_academic_year ON public.invoices(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE status IN ('pending', 'partial', 'overdue');

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON public.parent_student_links(parent_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON public.parent_student_links(student_id) WHERE status = 'approved';

-- ============================================
-- 5. MISSING FOREIGN KEY CONSTRAINTS (P1)
-- ============================================
-- enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_created_by_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_updated_by_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- attendance
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_created_by_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_updated_by_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- classes
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_created_by_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_updated_by_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- payment_allocations
ALTER TABLE public.payment_allocations DROP CONSTRAINT IF EXISTS payment_allocations_payment_fkey;
ALTER TABLE public.payment_allocations ADD CONSTRAINT payment_allocations_payment_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;
ALTER TABLE public.payment_allocations DROP CONSTRAINT IF EXISTS payment_allocations_invoice_fkey;
ALTER TABLE public.payment_allocations ADD CONSTRAINT payment_allocations_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- user_permissions
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_fkey;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_granted_by_fkey;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 6. updated_at AUTOMATIC TRIGGER SETUP (P2)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to apply trigger if not exists
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT c.table_name 
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
    WHERE c.column_name = 'updated_at'
      AND c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  LOOP
    -- Drop if exists and recreate trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;
