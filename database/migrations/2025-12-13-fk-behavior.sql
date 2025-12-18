-- 2025-12-13: Conservative FK ON DELETE behavior additions
-- Adds explicit ON DELETE behaviour for a small set of relationships if not already defined.

BEGIN;

-- Ensure pgcrypto extension present (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: add FK only if not present. We choose conservative behaviors (SET NULL for optional links, RESTRICT for core links).

-- 1) invoices.student_account_id -> student_accounts(id)  ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='student_account_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='invoices' AND kcu.column_name='student_account_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.invoices ADD CONSTRAINT invoices_student_account_id_fkey FOREIGN KEY (student_account_id) REFERENCES public.student_accounts(id) ON DELETE SET NULL;';
    END IF;
  END IF;
END$$;

-- 2) payments.invoice_id -> invoices(id)  ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='invoice_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='payments' AND kcu.column_name='invoice_id'
    ) THEN
      EXECUTE 'ALTER TABLE public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;';
    END IF;
  END IF;
END$$;

-- 3) attendance.marked_by -> profiles(id)  ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='marked_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='attendance' AND kcu.column_name='marked_by'
    ) THEN
      EXECUTE 'ALTER TABLE public.attendance ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;';
    END IF;
  END IF;
END$$;

COMMIT;

-- End conservative ON DELETE behavior migration
