-- COMPLETE VIETNAMESE EDUCATION SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor to ensure all tables exist

DO $$
BEGIN
  ---------------------------------------------------------------------------
  -- 1. Curriculum Standards (Chuẩn chương trình)
  ---------------------------------------------------------------------------
  IF to_regclass('public.curriculum_standards') IS NULL THEN
    CREATE TABLE public.curriculum_standards (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      subject_id uuid NOT NULL,
      grade_level text NOT NULL,
      academic_year_id uuid NOT NULL,
      standard_code text NOT NULL,
      title text NOT NULL,
      description text,
      learning_objectives jsonb,
      competencies jsonb,
      assessment_criteria jsonb,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT curriculum_standards_pkey PRIMARY KEY (id),
      CONSTRAINT curriculum_standards_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
      CONSTRAINT curriculum_standards_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
    );

    CREATE INDEX idx_curriculum_standards_subject ON curriculum_standards(subject_id);
    CREATE INDEX idx_curriculum_standards_grade ON curriculum_standards(grade_level);
    CREATE INDEX idx_curriculum_standards_year ON curriculum_standards(academic_year_id);

    COMMENT ON TABLE curriculum_standards IS 'Vietnamese curriculum standards and learning objectives by subject and grade level';
  END IF;

  ---------------------------------------------------------------------------
  -- 2. Evaluation Types (Loại điểm: Thường xuyên, Giữa kỳ, Cuối kỳ)
  ---------------------------------------------------------------------------
  IF to_regclass('public.evaluation_types') IS NULL THEN
    CREATE TABLE public.evaluation_types (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      code text NOT NULL UNIQUE,
      weight integer NOT NULL DEFAULT 1,
      description text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT evaluation_types_pkey PRIMARY KEY (id)
    );
    
    -- Seed default values
    INSERT INTO public.evaluation_types (name, code, weight, description) VALUES
    ('Đánh giá thường xuyên', 'REGULAR', 1, 'Kiểm tra miệng, 15 phút, 1 tiết'),
    ('Giữa kỳ', 'MIDTERM', 2, 'Kiểm tra giữa học kỳ'),
    ('Cuối kỳ', 'FINAL', 3, 'Kiểm tra cuối học kỳ');
  END IF;

  ---------------------------------------------------------------------------
  -- 3. Subject Groups (Tổ hợp môn: KHTN, KHXH)
  ---------------------------------------------------------------------------
  IF to_regclass('public.subject_groups') IS NULL THEN
    CREATE TABLE public.subject_groups (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      code text NOT NULL UNIQUE,
      description text,
      grade_level text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT subject_groups_pkey PRIMARY KEY (id)
    );
  END IF;

  ---------------------------------------------------------------------------
  -- 4. Subject Group Subjects (Link subjects to groups)
  ---------------------------------------------------------------------------
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

  ---------------------------------------------------------------------------
  -- 5. Student Conducts (Hạnh kiểm / Rèn luyện)
  ---------------------------------------------------------------------------
  IF to_regclass('public.student_conducts') IS NULL THEN
    CREATE TABLE public.student_conducts (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      academic_year_id uuid NOT NULL,
      term text NOT NULL CHECK (term = ANY (ARRAY['HK1'::text, 'HK2'::text, 'YEAR'::text])),
      rating text NOT NULL CHECK (rating = ANY (ARRAY['Tốt'::text, 'Khá'::text, 'Đạt'::text, 'Chưa đạt'::text])),
      comments text,
      evaluated_by uuid,
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

  ---------------------------------------------------------------------------
  -- 6. Add Columns to Existing Tables
  ---------------------------------------------------------------------------
  
  -- Update classes table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'grade_level') THEN
    ALTER TABLE public.classes ADD COLUMN grade_level text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'academic_year_id') THEN
    ALTER TABLE public.classes ADD COLUMN academic_year_id uuid REFERENCES public.academic_years(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'subject_group_id') THEN
    ALTER TABLE public.classes ADD COLUMN subject_group_id uuid REFERENCES public.subject_groups(id);
  END IF;

  -- Update courses table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'class_id') THEN
    ALTER TABLE public.courses ADD COLUMN class_id uuid REFERENCES public.classes(id);
  END IF;

  -- Update assignments table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'evaluation_type_id') THEN
    ALTER TABLE public.assignments ADD COLUMN evaluation_type_id uuid REFERENCES public.evaluation_types(id);
  END IF;

  ---------------------------------------------------------------------------
  -- 7. Force Schema Cache Reload (Notify PostgREST)
  ---------------------------------------------------------------------------
  NOTIFY pgrst, 'reload schema';

END $$;
