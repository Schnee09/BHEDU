-- Restore grading_scales table if missing
-- Created to fix runtime error "Could not find the table 'public.grading_scales' in the schema cache"

DO $$
BEGIN
  IF to_regclass('public.grading_scales') IS NULL THEN
    CREATE TABLE public.grading_scales (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      scale jsonb,
      is_default boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      CONSTRAINT grading_scales_pkey PRIMARY KEY (id)
    );

    -- Add RLS
    ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

    -- Add policies (Admins full access, others view)
    CREATE POLICY "Admins can manage grading scales"
      ON public.grading_scales
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'staff')
        )
      );

    CREATE POLICY "Everyone can view grading scales"
      ON public.grading_scales
      FOR SELECT
      USING (true);

    -- Notify realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE grading_scales;
  END IF;
END $$;
