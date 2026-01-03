-- Migration: Create grade_categories table for Vietnamese grade entry
-- Created: 2025-12-20
-- Safe guard for replays

DO $$
BEGIN
  IF to_regclass('public.grade_categories') IS NULL THEN
    CREATE TABLE public.grade_categories (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      class_id uuid NOT NULL REFERENCES public.classes(id),
      code text NOT NULL,
      name text,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT grade_categories_pkey PRIMARY KEY (id),
      CONSTRAINT grade_categories_class_code_unique UNIQUE (class_id, code)
    );
  END IF;
END
$$;