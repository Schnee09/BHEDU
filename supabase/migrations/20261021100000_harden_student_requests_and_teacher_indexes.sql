-- Harden student request access and align indexes with production query shapes.

CREATE INDEX IF NOT EXISTS idx_student_requests_status_created_at
  ON public.student_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_requests_class_status_created_at
  ON public.student_requests(class_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_requests_student_created_at
  ON public.student_requests(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_year_issue_student
  ON public.invoices(academic_year_id, issue_date, student_id);

DROP POLICY IF EXISTS "Admins and teachers can view student requests"
  ON public.student_requests;
DROP POLICY IF EXISTS "Students and parents can create requests"
  ON public.student_requests;
DROP POLICY IF EXISTS "Authorized staff can review requests"
  ON public.student_requests;
DROP POLICY IF EXISTS "Student requests scoped select"
  ON public.student_requests;
DROP POLICY IF EXISTS "Student requests scoped insert"
  ON public.student_requests;
DROP POLICY IF EXISTS "Student requests staff update"
  ON public.student_requests;
DROP POLICY IF EXISTS "Student requests owner cancel"
  ON public.student_requests;

CREATE POLICY "Student requests scoped select"
  ON public.student_requests
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR (
      public.get_current_user_role() IN ('teacher', 'tutor')
      AND class_id IS NOT NULL
      AND public.is_teacher_of_class(class_id)
    )
    OR student_id = public.get_current_profile_id()
    OR (
      parent_id = public.get_current_profile_id()
      AND EXISTS (
        SELECT 1
        FROM public.parent_student_links psl
        WHERE psl.parent_id = public.get_current_profile_id()
          AND psl.student_id = student_requests.student_id
          AND psl.status = 'approved'
      )
    )
  );

CREATE POLICY "Student requests scoped insert"
  ON public.student_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR student_id = public.get_current_profile_id()
    OR (
      parent_id = public.get_current_profile_id()
      AND EXISTS (
        SELECT 1
        FROM public.parent_student_links psl
        WHERE psl.parent_id = public.get_current_profile_id()
          AND psl.student_id = student_requests.student_id
          AND psl.status = 'approved'
      )
    )
  );

CREATE POLICY "Student requests staff update"
  ON public.student_requests
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR (
      public.get_current_user_role() IN ('teacher', 'tutor')
      AND class_id IS NOT NULL
      AND public.is_teacher_of_class(class_id)
    )
  )
  WITH CHECK (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR (
      public.get_current_user_role() IN ('teacher', 'tutor')
      AND class_id IS NOT NULL
      AND public.is_teacher_of_class(class_id)
    )
  );
