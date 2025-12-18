-- Migration: Assignments and attendance
-- Created: 2025-12-16
-- Guarded for safe replay in fresh DB

DO $$
BEGIN
  -- assignment_categories (references classes)
  IF to_regclass('public.assignment_categories') IS NULL THEN
    CREATE TABLE public.assignment_categories (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      weight numeric DEFAULT 0,
      class_id uuid,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT assignment_categories_pkey PRIMARY KEY (id),
      CONSTRAINT assignment_categories_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
    );
  END IF;

  -- assignments (references classes, assignment_categories)
  IF to_regclass('public.assignments') IS NULL THEN
    CREATE TABLE public.assignments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      class_id uuid NOT NULL,
      category_id uuid,
      title text NOT NULL,
      description text,
      due_date date,
      max_points numeric DEFAULT 100,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT assignments_pkey PRIMARY KEY (id),
      CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
      CONSTRAINT assignments_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.assignment_categories(id)
    );
  END IF;

  -- attendance (references profiles, classes)
  IF to_regclass('public.attendance') IS NULL THEN
    CREATE TABLE public.attendance (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      class_id uuid NOT NULL,
      date date NOT NULL,
      status text CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text, 'half_day'::text])),
      check_in_time time without time zone,
      check_out_time time without time zone,
      notes text,
      marked_by uuid,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT attendance_pkey PRIMARY KEY (id),
      CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
    );
  END IF;

  -- attendance_reports (references classes, profiles)
  IF to_regclass('public.attendance_reports') IS NULL THEN
    CREATE TABLE public.attendance_reports (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      report_type character varying NOT NULL,
      class_id uuid,
      student_id uuid,
      date_from date NOT NULL,
      date_to date NOT NULL,
      total_days integer,
      present_count integer,
      absent_count integer,
      late_count integer,
      excused_count integer,
      attendance_rate numeric,
      report_data jsonb,
      generated_at timestamp with time zone DEFAULT now(),
      generated_by uuid,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT attendance_reports_pkey PRIMARY KEY (id),
      CONSTRAINT attendance_reports_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
      CONSTRAINT attendance_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT attendance_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.profiles(id)
    );
  END IF;
END
$$;