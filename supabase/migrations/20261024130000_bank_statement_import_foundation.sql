-- Bank statement import foundation. Imported rows are staged for matching;
-- they never create payments until a user or a high-confidence rule confirms them.

CREATE TABLE IF NOT EXISTS public.bank_statement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'file',
  bank_code TEXT,
  account_number_masked TEXT,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  statement_from DATE,
  statement_to DATE,
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  imported_rows INTEGER NOT NULL DEFAULT 0 CHECK (imported_rows >= 0),
  duplicate_rows INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_rows >= 0),
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  imported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, file_hash)
);

CREATE TABLE IF NOT EXISTS public.bank_statement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.bank_statement_batches(id) ON DELETE RESTRICT,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  transaction_at TIMESTAMPTZ NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  direction TEXT NOT NULL DEFAULT 'credit' CHECK (direction IN ('credit', 'debit')),
  description TEXT,
  reference_number TEXT,
  counterparty_name TEXT,
  counterparty_account TEXT,
  bank_transaction_id TEXT,
  fingerprint TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  match_status TEXT NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('unmatched', 'suggested', 'confirmed', 'ignored', 'needs_review')),
  suggested_student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  matched_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  match_confidence NUMERIC(5, 4) CHECK (
    match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1)
  ),
  match_reason JSONB,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, row_number),
  UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_match_queue
  ON public.bank_statement_transactions(match_status, transaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference
  ON public.bank_statement_transactions(reference_number)
  WHERE reference_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_suggested_student
  ON public.bank_statement_transactions(suggested_student_id, match_status);

ALTER TABLE public.bank_statement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance staff view statement batches" ON public.bank_statement_batches;
CREATE POLICY "Finance staff view statement batches"
  ON public.bank_statement_batches FOR SELECT TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
DROP POLICY IF EXISTS "Finance staff view statement transactions" ON public.bank_statement_transactions;
CREATE POLICY "Finance staff view statement transactions"
  ON public.bank_statement_transactions FOR SELECT TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

GRANT SELECT ON public.bank_statement_batches TO authenticated;
GRANT SELECT ON public.bank_statement_transactions TO authenticated;
GRANT ALL ON public.bank_statement_batches TO service_role;
GRANT ALL ON public.bank_statement_transactions TO service_role;

CREATE OR REPLACE FUNCTION public.bank_transaction_fingerprint(
  p_bank_code TEXT,
  p_account_scope TEXT,
  p_transaction_at TIMESTAMPTZ,
  p_amount NUMERIC,
  p_direction TEXT,
  p_reference_number TEXT,
  p_description TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(concat_ws('|',
    lower(trim(COALESCE(p_bank_code, ''))),
    lower(trim(COALESCE(p_account_scope, ''))),
    to_char(p_transaction_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS'),
    round(p_amount, 2)::text,
    lower(trim(COALESCE(p_direction, 'credit'))),
    lower(regexp_replace(trim(COALESCE(p_reference_number, '')), '\s+', '', 'g')),
    lower(regexp_replace(trim(COALESCE(p_description, '')), '\s+', ' ', 'g'))
  ));
$$;

REVOKE ALL ON FUNCTION public.bank_transaction_fingerprint(
  TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_transaction_fingerprint(
  TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT
) TO authenticated, service_role;
