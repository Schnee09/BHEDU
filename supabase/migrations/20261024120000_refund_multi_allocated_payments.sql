-- Keep one refund record while recording how much of that refund reverses
-- each invoice allocation. Unallocated credit is refunded before allocations.

ALTER TABLE public.payment_refunds ALTER COLUMN invoice_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_refund_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES public.payment_refunds(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refund_allocations_refund
  ON public.payment_refund_allocations(refund_id);

ALTER TABLE public.payment_refund_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance staff view refund allocations" ON public.payment_refund_allocations;
CREATE POLICY "Finance staff view refund allocations"
  ON public.payment_refund_allocations FOR SELECT TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
GRANT SELECT ON public.payment_refund_allocations TO authenticated;
GRANT ALL ON public.payment_refund_allocations TO service_role;

CREATE OR REPLACE FUNCTION public.refund_payment_atomic(
  p_payment_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_refunded_by UUID DEFAULT NULL
)
RETURNS public.payment_refunds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
  v_refund public.payment_refunds;
  v_invoice public.invoices;
  v_refundable NUMERIC(12, 2);
  v_allocated NUMERIC(12, 2);
  v_unallocated NUMERIC(12, 2);
  v_to_reverse NUMERIC(12, 2);
  v_reverse NUMERIC(12, 2);
  v_row RECORD;
  v_new_paid NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND OR v_payment.status IN ('cancelled', 'failed') THEN
    RAISE EXCEPTION 'Payment is not refundable';
  END IF;
  v_refundable := v_payment.amount - COALESCE(v_payment.refunded_amount, 0);
  IF p_amount <= 0 OR p_amount > v_refundable THEN
    RAISE EXCEPTION 'Refund amount exceeds the refundable balance';
  END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'Refund reason is required';
  END IF;

  SELECT COALESCE(SUM(pa.amount), 0) - COALESCE((
    SELECT SUM(pra.amount)
    FROM public.payment_refund_allocations pra
    JOIN public.payment_refunds pr ON pr.id = pra.refund_id
    WHERE pr.payment_id = v_payment.id
  ), 0) INTO v_allocated
  FROM public.payment_allocations pa WHERE pa.payment_id = v_payment.id;

  v_unallocated := GREATEST(0, v_refundable - v_allocated);
  v_to_reverse := GREATEST(0, p_amount - v_unallocated);

  INSERT INTO public.payment_refunds(
    refund_number, payment_id, invoice_id, amount, reason, refunded_by
  ) VALUES (
    'BH-HT-' || to_char(current_date, 'YYYY') || '-' ||
      lpad(nextval('public.finance_refund_number_seq')::text, 6, '0'),
    v_payment.id, NULL, p_amount, trim(p_reason), p_refunded_by
  ) RETURNING * INTO v_refund;

  FOR v_row IN
    SELECT pa.invoice_id,
      SUM(pa.amount) - COALESCE((
        SELECT SUM(pra.amount)
        FROM public.payment_refund_allocations pra
        JOIN public.payment_refunds pr ON pr.id = pra.refund_id
        WHERE pr.payment_id = v_payment.id AND pra.invoice_id = pa.invoice_id
      ), 0) AS available
    FROM public.payment_allocations pa
    WHERE pa.payment_id = v_payment.id
    GROUP BY pa.invoice_id
    ORDER BY MAX(pa.created_at) DESC
  LOOP
    EXIT WHEN v_to_reverse <= 0;
    v_reverse := LEAST(v_to_reverse, v_row.available);
    CONTINUE WHEN v_reverse <= 0;

    SELECT * INTO v_invoice FROM public.invoices WHERE id = v_row.invoice_id FOR UPDATE;
    INSERT INTO public.payment_refund_allocations(refund_id, invoice_id, amount)
    VALUES (v_refund.id, v_invoice.id, v_reverse);

    v_new_paid := GREATEST(0, v_invoice.paid_amount - v_reverse);
    UPDATE public.invoices
    SET paid_amount = v_new_paid,
        status = CASE WHEN v_new_paid <= 0 THEN 'pending'::invoice_status
          WHEN v_new_paid < total_amount THEN 'partial'::invoice_status
          ELSE 'paid'::invoice_status END,
        updated_at = now()
    WHERE id = v_invoice.id;

    UPDATE public.student_accounts
    SET total_paid = GREATEST(0, total_paid - v_reverse),
        balance = balance + v_reverse,
        updated_at = now()
    WHERE id = v_invoice.student_account_id;
    v_to_reverse := v_to_reverse - v_reverse;
  END LOOP;

  IF v_to_reverse > 0 THEN RAISE EXCEPTION 'Refund cannot be matched to allocations'; END IF;

  UPDATE public.payments
  SET refunded_amount = refunded_amount + p_amount,
      status = CASE WHEN refunded_amount + p_amount >= amount
        THEN 'refunded'::payment_status ELSE status END,
      updated_at = now()
  WHERE id = v_payment.id;
  RETURN v_refund;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_payment_atomic(UUID, NUMERIC, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_payment_atomic(UUID, NUMERIC, TEXT, UUID)
  TO service_role;
