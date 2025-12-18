-- Migration: Courses and enrollments
-- Created: 2025-12-16
-- Guarded for safe replay in fresh DB

DO $$
BEGIN
  -- courses (references subjects, profiles, academic_years)
  IF to_regclass('public.courses') IS NULL THEN
    CREATE TABLE public.courses (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      subject_id uuid,
      teacher_id uuid,
      academic_year_id uuid,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT courses_pkey PRIMARY KEY (id),
      CONSTRAINT courses_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
      CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
      CONSTRAINT courses_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
    );
  END IF;

  -- lessons (references courses)
  IF to_regclass('public.lessons') IS NULL THEN
    CREATE TABLE public.lessons (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      course_id uuid NOT NULL,
      title text NOT NULL,
      content text,
      lesson_order integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT lessons_pkey PRIMARY KEY (id),
      CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
    );
  END IF;

  -- enrollments (references profiles)
  IF to_regclass('public.enrollments') IS NULL THEN
    CREATE TABLE public.enrollments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      class_id uuid NOT NULL,
      enrollment_date date DEFAULT CURRENT_DATE,
      status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'withdrawn'::text])),
      CONSTRAINT enrollments_pkey PRIMARY KEY (id),
      CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
    );
  END IF;

  -- guardians (references profiles)
  IF to_regclass('public.guardians') IS NULL THEN
    CREATE TABLE public.guardians (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      name character varying NOT NULL,
      relationship character varying CHECK (relationship::text = ANY (ARRAY['father'::character varying, 'mother'::character varying, 'guardian'::character varying, 'grandparent'::character varying, 'sibling'::character varying, 'other'::character varying]::text[])),
      phone character varying,
      email character varying,
      address text,
      is_primary_contact boolean DEFAULT false,
      is_emergency_contact boolean DEFAULT false,
      occupation character varying,
      workplace character varying,
      work_phone character varying,
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT guardians_pkey PRIMARY KEY (id),
      CONSTRAINT guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
    );
  END IF;

  -- student_accounts (references profiles, academic_years)
  IF to_regclass('public.student_accounts') IS NULL THEN
    CREATE TABLE public.student_accounts (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      academic_year_id uuid NOT NULL,
      balance numeric NOT NULL DEFAULT 0.00,
      total_fees numeric NOT NULL DEFAULT 0.00,
      total_paid numeric NOT NULL DEFAULT 0.00,
      status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'graduated'::text])),
      notes text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT student_accounts_pkey PRIMARY KEY (id),
      CONSTRAINT student_accounts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT student_accounts_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
    );
  END IF;
END
$$;