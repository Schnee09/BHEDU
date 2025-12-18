-- 2025-12-13: Fixes & cleanup for schema provided by user
-- This migration is intentionally conservative and idempotent where possible.
-- Review before running on production. Run in a transaction and test on staging.

BEGIN;

-- 1) Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Normalize UUID defaults: prefer gen_random_uuid() across the schema.
-- Replace uuid_generate_v4() defaults (used in some tables) with gen_random_uuid().
-- This uses ALTER ... SET DEFAULT which is safe if the column already has that default.
DO $$
BEGIN
  -- qr_codes.id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='qr_codes' AND column_name='id') THEN
    EXECUTE 'ALTER TABLE public.qr_codes ALTER COLUMN id SET DEFAULT gen_random_uuid();';
  END IF;
END$$;

-- 3) Fix payment_schedule_installments: remove redundant 'id' column if present and ensure a clear primary key.
-- If you prefer a surrogate PK instead, change the steps accordingly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_schedule_installments' AND column_name='id') THEN
    -- Drop the redundant id column so the natural PK (schedule_id, installment_number) is used.
    BEGIN
      EXECUTE 'ALTER TABLE public.payment_schedule_installments DROP COLUMN IF EXISTS id;';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop id column on payment_schedule_installments: %', SQLERRM;
    END;
  END IF;

  -- Ensure schedule_id and installment_number are NOT NULL for PK semantics
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_schedule_installments' AND column_name='schedule_id') THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ALTER COLUMN schedule_id SET NOT NULL;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_schedule_installments' AND column_name='installment_number') THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ALTER COLUMN installment_number SET NOT NULL;';
  END IF;

  -- Add PK if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'p' AND t.relname = 'payment_schedule_installments'
  ) THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ADD CONSTRAINT payment_schedule_installments_pkey PRIMARY KEY (schedule_id, installment_number);';
  END IF;
END$$;

-- 4) Add missing FK: enrollments.class_id -> classes(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='class_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='enrollments' AND kcu.column_name='class_id'
    ) THEN
      -- Add FK; use ON DELETE RESTRICT to be conservative
      EXECUTE 'ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;';
    END IF;
  END IF;
END$$;

-- 5) Rename ambiguous profiles.student_id -> profiles.legacy_student_id (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='student_id') THEN
    -- Only rename if the target name does not already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='legacy_student_id') THEN
      EXECUTE 'ALTER TABLE public.profiles RENAME COLUMN student_id TO legacy_student_id;';
    ELSE
      RAISE NOTICE 'profiles.legacy_student_id already exists; skipping rename of profiles.student_id';
    END IF;
  END IF;
END$$;

-- 6) Add sensible indexes for common FK columns to improve join performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON public.grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);

-- 7) Safety notes: do not alter FK ON DELETE behaviour automatically; review and apply explicit cascades later.

COMMIT;

-- End migration
