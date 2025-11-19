-- Comprehensive Fix Migration
-- Date: 2025-11-20 12:00
-- Purpose: Final consolidated fix for all schema and RLS issues
-- This migration supersedes: 038, 20251120, 20251120_0200

------------------------------------------------------------
-- PART 1: Create security definer function (idempotent)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 'Security definer function to check admin role without RLS recursion';

------------------------------------------------------------
-- PART 2: Fix classes table schema (add missing columns)
------------------------------------------------------------
-- Add all missing columns that APIs expect
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS room_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS schedule TEXT,
  ADD COLUMN IF NOT EXISTS max_students INTEGER,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data
UPDATE public.classes 
SET grade_level = grade 
WHERE grade_level IS NULL AND grade IS NOT NULL;

UPDATE public.classes 
SET status = 'active' 
WHERE status IS NULL;

UPDATE public.classes
SET code = 'CLS-' || SUBSTRING(id::text, 1, 8)
WHERE code IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON public.classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);

------------------------------------------------------------
-- PART 3: Fix profiles table RLS policies (no recursion)
------------------------------------------------------------
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles (fn)" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users read own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Read teacher profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create clean, non-recursive policies
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Read teacher and admin profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (role IN ('teacher', 'admin'));

CREATE POLICY "Teachers read their students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    role = 'student' AND EXISTS (
      SELECT 1 FROM public.enrollments e
      INNER JOIN public.classes c ON e.class_id = c.id
      WHERE e.student_id = profiles.id
      AND c.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- PART 4: Fix classes table RLS policies
------------------------------------------------------------
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers read own classes" ON public.classes;
DROP POLICY IF EXISTS "Students read enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "classes_teacher_all" ON public.classes;
DROP POLICY IF EXISTS "classes_student_read" ON public.classes;

CREATE POLICY "Admins manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers read own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students read enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE class_id = classes.id
      AND student_id = auth.uid()
    )
  );

------------------------------------------------------------
-- PART 5: Fix enrollments table RLS policies
------------------------------------------------------------
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers read class enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students read own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_teacher_read" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_read" ON public.enrollments;

CREATE POLICY "Admins manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Teachers read class enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = enrollments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students read own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

------------------------------------------------------------
-- PART 6: Fix assignments table RLS policies
------------------------------------------------------------
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers manage class assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students read class assignments" ON public.assignments;
DROP POLICY IF EXISTS "assignments_teacher_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_student_read" ON public.assignments;

CREATE POLICY "Admins manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Teachers manage class assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assignments.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students read class assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.class_id = assignments.class_id
      AND enrollments.student_id = auth.uid()
    )
  );

------------------------------------------------------------
-- PART 7: Fix grades table RLS policies
------------------------------------------------------------
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers manage class grades" ON public.grades;
DROP POLICY IF EXISTS "Students read own grades" ON public.grades;
DROP POLICY IF EXISTS "grades_admin_all" ON public.grades;
DROP POLICY IF EXISTS "grades_teacher_all" ON public.grades;
DROP POLICY IF EXISTS "grades_student_read" ON public.grades;

CREATE POLICY "Admins manage grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Teachers manage grades"
  ON public.grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      INNER JOIN public.classes c ON a.class_id = c.id
      WHERE a.id = grades.assignment_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students read own grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

------------------------------------------------------------
-- PART 8: Fix attendance table RLS policies
------------------------------------------------------------
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers manage class attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students read own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers read attendance" ON public.attendance;

CREATE POLICY "Admins manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Teachers manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = attendance.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students read own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

------------------------------------------------------------
-- PART 9: Fix academic_years table RLS policies
------------------------------------------------------------
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage academic_years" ON public.academic_years;
DROP POLICY IF EXISTS "Everyone can view academic_years" ON public.academic_years;

CREATE POLICY "Admins manage academic_years"
  ON public.academic_years FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Everyone views academic_years"
  ON public.academic_years FOR SELECT
  TO authenticated
  USING (true);

------------------------------------------------------------
-- PART 10: Add column comments
------------------------------------------------------------
COMMENT ON COLUMN public.classes.code IS 'Unique class code identifier';
COMMENT ON COLUMN public.classes.grade_level IS 'Grade level (e.g., 10, 11, 12)';
COMMENT ON COLUMN public.classes.status IS 'Class status: active, archived, draft';
COMMENT ON COLUMN public.classes.academic_year_id IS 'Reference to academic year';
