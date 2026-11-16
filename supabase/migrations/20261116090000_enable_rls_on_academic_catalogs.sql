ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_conducts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view academic years" ON public.academic_years;
CREATE POLICY "Authenticated view academic years"
  ON public.academic_years
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated view assignment categories" ON public.assignment_categories;
CREATE POLICY "Authenticated view assignment categories"
  ON public.assignment_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated view evaluation types" ON public.evaluation_types;
CREATE POLICY "Authenticated view evaluation types"
  ON public.evaluation_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated view relevant assignments" ON public.assignments;
CREATE POLICY "Authenticated view relevant assignments"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff')
    OR teacher_id = public.get_current_profile_id()
    OR EXISTS (
      SELECT 1
      FROM public.classes AS class_record
      WHERE class_record.id = assignments.class_id
        AND class_record.teacher_id = public.get_current_profile_id()
    )
    OR EXISTS (
      SELECT 1
      FROM public.enrollments AS enrollment
      WHERE enrollment.class_id = assignments.class_id
        AND enrollment.student_id = public.get_current_profile_id()
        AND enrollment.deleted_at IS NULL
        AND enrollment.status = 'enrolled'
    )
  );

-- No client policy is created for student_conducts yet. Until its workflow and
-- ownership rules are implemented, only service-role server code may access it.

GRANT SELECT ON TABLE public.academic_years TO authenticated;
GRANT SELECT ON TABLE public.assignment_categories TO authenticated;
GRANT SELECT ON TABLE public.assignments TO authenticated;
GRANT SELECT ON TABLE public.evaluation_types TO authenticated;

GRANT ALL ON TABLE public.academic_years TO service_role;
GRANT ALL ON TABLE public.assignment_categories TO service_role;
GRANT ALL ON TABLE public.assignments TO service_role;
GRANT ALL ON TABLE public.evaluation_types TO service_role;
GRANT ALL ON TABLE public.student_conducts TO service_role;
