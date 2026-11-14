-- Restore assignment lifecycle fields used by the web application without
-- duplicating max_points under a second database column.
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

UPDATE public.assignments
SET assigned_date = COALESCE(assigned_date, created_at, now())
WHERE assigned_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_class_published
  ON public.assignments (class_id, published);

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS assignment_id UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.grades
  DROP CONSTRAINT IF EXISTS grades_assignment_id_fkey;

UPDATE public.grades g
SET assignment_id = NULL
WHERE assignment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = g.assignment_id
  );

ALTER TABLE public.grades
  ADD CONSTRAINT grades_assignment_id_fkey
  FOREIGN KEY (assignment_id)
  REFERENCES public.assignments(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_grades_assignment_active
  ON public.grades (assignment_id)
  WHERE assignment_id IS NOT NULL AND deleted_at IS NULL;
