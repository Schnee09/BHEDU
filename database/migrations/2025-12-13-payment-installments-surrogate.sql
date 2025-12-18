-- Alternative migration: keep a surrogate `id` on payment_schedule_installments
-- This migration is conservative and idempotent: it will only add columns/constraints when missing.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add `id` column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_schedule_installments' AND column_name='id'
  ) THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();';
  END IF;
END$$;

-- 2) If composite PK exists, drop it and add surrogate PK on id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = ''p'' AND t.relname = ''payment_schedule_installments''
  ) THEN
    -- Drop existing PK
    EXECUTE 'ALTER TABLE public.payment_schedule_installments DROP CONSTRAINT IF EXISTS payment_schedule_installments_pkey;';
  END IF;

  -- Add PK on id if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = ''p'' AND t.relname = ''payment_schedule_installments'' AND (
      SELECT array_agg(attname) FROM (
        SELECT a.attname FROM pg_attribute a
        JOIN pg_constraint cc ON cc.conrelid = a.attrelid
        WHERE cc.contype = ''p'' AND cc.conrelid = t.oid
      ) s
    ) IS NOT NULL
  ) THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ADD CONSTRAINT payment_schedule_installments_pkey PRIMARY KEY (id);';
  END IF;
END$$;

-- 3) Ensure uniqueness of (schedule_id, installment_number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    WHERE c.relname = 'payment_schedule_installments' AND i.indisunique = true
    AND EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) AND a.attname = 'schedule_id'
    )
  ) THEN
    EXECUTE 'ALTER TABLE public.payment_schedule_installments ADD CONSTRAINT uq_payment_schedule_installments_schedule_installment UNIQUE (schedule_id, installment_number);';
  END IF;
END$$;

COMMIT;

-- End alternative surrogate-id migration
