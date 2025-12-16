-- Migration: Profiles and classes
-- Created: 2025-12-16
-- Guarded for safe replay in fresh DB

DO $$
BEGIN
  -- profiles (references auth.users, which is external)
  IF to_regclass('public.profiles') IS NULL THEN
    CREATE TABLE public.profiles (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id uuid,
      first_name text,
      last_name text,
      full_name text,
      email text,
      date_of_birth date,
      phone text,
      address text,
      emergency_contact text,
      role text CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text, 'teacher'::text, 'student'::text])) OR role IS NULL),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      student_id text,
      grade_level text,
      gender character varying,
      enrollment_date date DEFAULT CURRENT_DATE,
      status character varying DEFAULT 'active'::character varying,
      photo_url text,
      department text,
      is_active boolean DEFAULT true,
      created_by uuid,
      notes text,
      student_code character varying UNIQUE,
      CONSTRAINT profiles_pkey PRIMARY KEY (id),
      CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
    );
  END IF;

  -- classes (references profiles)
  IF to_regclass('public.classes') IS NULL THEN
    CREATE TABLE public.classes (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      teacher_id uuid,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT classes_pkey PRIMARY KEY (id),
      CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
    );
  END IF;
END
$$;