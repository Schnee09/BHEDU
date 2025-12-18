-- Add curriculum standards tables for Vietnamese education system

DO $$
BEGIN
  -- Create curriculum_standards table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'curriculum_standards'
  ) THEN
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

    -- Add indexes
    CREATE INDEX idx_curriculum_standards_subject ON curriculum_standards(subject_id);
    CREATE INDEX idx_curriculum_standards_grade ON curriculum_standards(grade_level);
    CREATE INDEX idx_curriculum_standards_year ON curriculum_standards(academic_year_id);

    COMMENT ON TABLE curriculum_standards IS 'Vietnamese curriculum standards and learning objectives by subject and grade level';
  END IF;
END $$;