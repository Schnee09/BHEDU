-- Migration: Optimize Student, Enrollment, and Dashboard Queries
-- Description: Add indices to support high-performance filtering and counting for dashboard widgets and detail pages.

-- 0. Ensure tables exist (Robustness check)
DO $$
BEGIN
  -- assignment_categories (references classes)
  IF to_regclass('public.assignment_categories') IS NULL THEN
    CREATE TABLE public.assignment_categories (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      weight numeric DEFAULT 0,
      class_id uuid REFERENCES public.classes(id),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT assignment_categories_pkey PRIMARY KEY (id)
    );
  END IF;

  -- assignments (references classes, assignment_categories)
  IF to_regclass('public.assignments') IS NULL THEN
    CREATE TABLE public.assignments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      class_id uuid NOT NULL REFERENCES public.classes(id),
      category_id uuid REFERENCES public.assignment_categories(id),
      title text NOT NULL,
      description text,
      due_date date,
      max_points numeric DEFAULT 100,
      teacher_id uuid REFERENCES public.profiles(id), -- Add teacher_id for "My Assignments"
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT assignments_pkey PRIMARY KEY (id)
    );
  END IF;

  -- attendance (references profiles, classes)
  IF to_regclass('public.attendance') IS NULL THEN
    CREATE TABLE public.attendance (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL REFERENCES public.profiles(id),
      class_id uuid NOT NULL REFERENCES public.classes(id),
      date date NOT NULL,
      status text CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text, 'half_day'::text])),
      check_in_time time without time zone,
      check_out_time time without time zone,
      notes text,
      marked_by uuid REFERENCES public.profiles(id),
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT attendance_pkey PRIMARY KEY (id)
    );
  END IF;
  
   -- Check for teacher_id column in assignments if table existed but column didn't
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.assignments ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);
     END IF;
  END IF;
END
$$;

-- 1. Student & Enrollment Optimization
-- Speed up looking up enrollments by student (Student Detail Page)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments (student_id);

-- Speed up filtering profiles by role (Dashboard Student/Teacher counts, Student List)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);


-- 2. Dashboard Statistics Optimization
-- Speed up counting assignments by class (Dashboard Assignments count)
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments (class_id);

-- Speed up counting attendance by date (Dashboard Attendance Today)
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (date);


-- 3. General Lookup Optimization
-- Ensure primary key lookups on classes are optimized (usually automatic, but good for joins)
-- Note: Postgres automatically indexes primary keys, but we ensure foreign key columns are indexed.

-- Index assignments by teacher (My Assignments view)
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments (teacher_id);
