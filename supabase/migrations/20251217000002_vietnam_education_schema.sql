-- Migration: Vietnamese Education System Enhancements
-- Created: 2025-12-17
-- Description: Adds support for Vietnamese grading weights, subject groups, and conduct assessment

DO $$
BEGIN
  -- 1. Create evaluation_types (Loại điểm)
  IF to_regclass('public.evaluation_types') IS NULL THEN
    CREATE TABLE public.evaluation_types (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL, -- e.g., "Đánh giá thường xuyên", "Giữa kỳ", "Cuối kỳ"
      code text NOT NULL UNIQUE, -- e.g., "REGULAR", "MIDTERM", "FINAL"
      weight integer NOT NULL DEFAULT 1, -- e.g., 1, 2, 3
      description text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT evaluation_types_pkey PRIMARY KEY (id)
    );

    -- Seed default Vietnamese evaluation types
    INSERT INTO public.evaluation_types (name, code, weight, description) VALUES
    ('Đánh giá thường xuyên', 'REGULAR', 1, 'Kiểm tra miệng, 15 phút, 1 tiết'),
    ('Giữa kỳ', 'MIDTERM', 2, 'Kiểm tra giữa học kỳ'),
    ('Cuối kỳ', 'FINAL', 3, 'Kiểm tra cuối học kỳ');
  END IF;

  -- 2. Create subject_groups (Tổ hợp môn)
  IF to_regclass('public.subject_groups') IS NULL THEN
    CREATE TABLE public.subject_groups (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL, -- e.g., "Khoa học Tự nhiên", "Khoa học Xã hội"
      code text NOT NULL UNIQUE, -- e.g., "KHTN", "KHXH"
      description text,
      grade_level text, -- e.g., "10", "11", "12"
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT subject_groups_pkey PRIMARY KEY (id)
    );
  END IF;

  -- 3. Create subject_group_subjects (Link subjects to groups)
  IF to_regclass('public.subject_group_subjects') IS NULL THEN
    CREATE TABLE public.subject_group_subjects (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      subject_group_id uuid NOT NULL,
      subject_id uuid NOT NULL,
      is_mandatory boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT subject_group_subjects_pkey PRIMARY KEY (id),
      CONSTRAINT subject_group_subjects_group_fkey FOREIGN KEY (subject_group_id) REFERENCES public.subject_groups(id),
      CONSTRAINT subject_group_subjects_subject_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
    );
  END IF;

  -- 4. Create student_conducts (Hạnh kiểm / Rèn luyện)
  IF to_regclass('public.student_conducts') IS NULL THEN
    CREATE TABLE public.student_conducts (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      academic_year_id uuid NOT NULL,
      term text NOT NULL CHECK (term = ANY (ARRAY['HK1'::text, 'HK2'::text, 'YEAR'::text])),
      rating text NOT NULL CHECK (rating = ANY (ARRAY['Tốt'::text, 'Khá'::text, 'Đạt'::text, 'Chưa đạt'::text])),
      comments text,
      evaluated_by uuid, -- Teacher who evaluated
      evaluated_at timestamp with time zone DEFAULT now(),
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT student_conducts_pkey PRIMARY KEY (id),
      CONSTRAINT student_conducts_student_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT student_conducts_year_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id),
      CONSTRAINT student_conducts_evaluator_fkey FOREIGN KEY (evaluated_by) REFERENCES public.profiles(id),
      CONSTRAINT student_conducts_unique_term UNIQUE (student_id, academic_year_id, term)
    );
  END IF;

  -- 5. Update classes table
  -- Add grade_level if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'grade_level') THEN
    ALTER TABLE public.classes ADD COLUMN grade_level text;
  END IF;

  -- Add academic_year_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'academic_year_id') THEN
    ALTER TABLE public.classes ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
  END IF;

  -- Add subject_group_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'subject_group_id') THEN
    ALTER TABLE public.classes ADD COLUMN subject_group_id uuid REFERENCES public.subject_groups(id);
  END IF;

  -- 6. Update courses table
  -- Add class_id to link course to a specific class
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'class_id') THEN
    ALTER TABLE public.courses ADD COLUMN class_id uuid REFERENCES public.classes(id);
  END IF;

  -- 7. Update assignments table
  -- Add evaluation_type_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'evaluation_type_id') THEN
    ALTER TABLE public.assignments ADD COLUMN evaluation_type_id uuid REFERENCES public.evaluation_types(id);
  END IF;

END $$;
