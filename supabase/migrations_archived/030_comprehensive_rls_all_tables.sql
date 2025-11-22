-- 030: Comprehensive RLS policies for all tables to enable cookie-based auth
-- Date: 2025-11-16
-- Goal: Replace service-role client usage with proper RLS throughout the app

------------------------------------------------------------
-- ENROLLMENTS: Students, Teachers, Admins
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all enrollments" ON enrollments;
CREATE POLICY "Admins manage all enrollments"
  ON enrollments FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage class enrollments" ON enrollments;
CREATE POLICY "Teachers manage class enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = enrollments.class_id AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- ASSIGNMENTS: Teachers create/manage, Students read, Admins all
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all assignments" ON assignments;
CREATE POLICY "Admins manage all assignments"
  ON assignments FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- GRADES: Teachers manage, Students read own, Admins all
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all grades" ON grades;
CREATE POLICY "Admins manage all grades"
  ON grades FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage grades for their classes" ON grades;
CREATE POLICY "Teachers manage grades for their classes"
  ON grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      INNER JOIN classes c ON a.class_id = c.id
      WHERE a.id = grades.assignment_id AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- ASSIGNMENT_CATEGORIES: Teachers manage, Students read, Admins all
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all assignment_categories" ON assignment_categories;
CREATE POLICY "Admins manage all assignment_categories"
  ON assignment_categories FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage assignment_categories for their classes" ON assignment_categories;
CREATE POLICY "Teachers manage assignment_categories for their classes"
  ON assignment_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assignment_categories.class_id AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- SUBMISSIONS: Teachers view/grade, Students manage own, Admins all
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all submissions" ON submissions;
CREATE POLICY "Admins manage all submissions"
  ON submissions FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- SCORES: Teachers manage, Students read own, Admins all
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all scores" ON scores;
CREATE POLICY "Admins manage all scores"
  ON scores FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- GUARDIANS: Admins manage, Students read own
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all guardians" ON guardians;
CREATE POLICY "Admins manage all guardians"
  ON guardians FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- IMPORT_LOGS: Admins only
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all import_logs" ON import_logs;
CREATE POLICY "Admins manage all import_logs"
  ON import_logs FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- IMPORT_ERRORS: Admins only
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all import_errors" ON import_errors;
CREATE POLICY "Admins manage all import_errors"
  ON import_errors FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- USER_ACTIVITY_LOGS: Admins read/write
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage user_activity_logs" ON user_activity_logs;
CREATE POLICY "Admins manage user_activity_logs"
  ON user_activity_logs FOR ALL
  USING (public.is_admin());

-- Allow system inserts (API routes need this)
DROP POLICY IF EXISTS "System insert user_activity_logs" ON user_activity_logs;
CREATE POLICY "System insert user_activity_logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (true);

------------------------------------------------------------
-- AUDIT_LOGS: Admins read, System insert
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read audit_logs" ON audit_logs;
CREATE POLICY "Admins read audit_logs"
  ON audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "System insert audit_logs" ON audit_logs;
CREATE POLICY "System insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

------------------------------------------------------------
-- SCHOOL_SETTINGS: Admins manage, Everyone reads
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage school_settings" ON school_settings;
CREATE POLICY "Admins manage school_settings"
  ON school_settings FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone reads school_settings" ON school_settings;
CREATE POLICY "Everyone reads school_settings"
  ON school_settings FOR SELECT
  USING (true);

------------------------------------------------------------
-- ACADEMIC_YEARS: Admins manage, Everyone reads
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage academic_years" ON academic_years;
CREATE POLICY "Admins manage academic_years"
  ON academic_years FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone reads academic_years" ON academic_years;
CREATE POLICY "Everyone reads academic_years"
  ON academic_years FOR SELECT
  USING (true);

------------------------------------------------------------
-- GRADING_SCALES: Admins manage, Everyone reads
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage grading_scales" ON grading_scales;
CREATE POLICY "Admins manage grading_scales"
  ON grading_scales FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone reads grading_scales" ON grading_scales;
CREATE POLICY "Everyone reads grading_scales"
  ON grading_scales FOR SELECT
  USING (true);

------------------------------------------------------------
-- FEE_TYPES: Admins manage, Everyone reads
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage fee_types" ON fee_types;
CREATE POLICY "Admins manage fee_types"
  ON fee_types FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone reads fee_types" ON fee_types;
CREATE POLICY "Everyone reads fee_types"
  ON fee_types FOR SELECT
  USING (true);

------------------------------------------------------------
-- PAYMENT_METHODS: Admins manage, Everyone reads
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage payment_methods" ON payment_methods;
CREATE POLICY "Admins manage payment_methods"
  ON payment_methods FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Everyone reads payment_methods" ON payment_methods;
CREATE POLICY "Everyone reads payment_methods"
  ON payment_methods FOR SELECT
  USING (true);

------------------------------------------------------------
-- PAYMENT_SCHEDULES: Admins manage
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage payment_schedules" ON payment_schedules;
CREATE POLICY "Admins manage payment_schedules"
  ON payment_schedules FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- PAYMENT_SCHEDULE_INSTALLMENTS: Admins manage
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage payment_schedule_installments" ON payment_schedule_installments;
CREATE POLICY "Admins manage payment_schedule_installments"
  ON payment_schedule_installments FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- STUDENT_ACCOUNTS: Admins manage, Students read own
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage student_accounts" ON student_accounts;
CREATE POLICY "Admins manage student_accounts"
  ON student_accounts FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- INVOICES: Admins manage, Students read own
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage invoices" ON invoices;
CREATE POLICY "Admins manage invoices"
  ON invoices FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- INVOICE_ITEMS: Admins manage
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage invoice_items" ON invoice_items;
CREATE POLICY "Admins manage invoice_items"
  ON invoice_items FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- PAYMENTS: Admins manage, Students read own
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage payments" ON payments;
CREATE POLICY "Admins manage payments"
  ON payments FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- PAYMENT_ALLOCATIONS: Admins manage
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage payment_allocations" ON payment_allocations;
CREATE POLICY "Admins manage payment_allocations"
  ON payment_allocations FOR ALL
  USING (public.is_admin());

------------------------------------------------------------
-- QR_CODES: Teachers and Admins manage
------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage qr_codes" ON qr_codes;
CREATE POLICY "Admins manage qr_codes"
  ON qr_codes FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage qr_codes for their classes" ON qr_codes;
CREATE POLICY "Teachers manage qr_codes for their classes"
  ON qr_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = qr_codes.class_id AND c.teacher_id = auth.uid()
    )
  );
