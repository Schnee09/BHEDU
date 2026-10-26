-- Receive money independently from invoices and optionally allocate it to
-- multiple invoices belonging to the same student in one transaction.

CREATE OR REPLACE FUNCTION public.allocate_student_payment_atomic(
  p_payment_id UUID,
  p_allocations JSONB
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
  v_invoice public.invoices;
  v_item JSONB;
  v_invoice_id UUID;
  v_amount NUMERIC(12, 2);
  v_existing_allocated NUMERIC(12, 2);
  v_requested_total NUMERIC(12, 2) := 0;
  v_new_paid NUMERIC(12, 2);
BEGIN
  IF p_allocations IS NULL OR jsonb_typeof(p_allocations) <> 'array' THEN
    RAISE EXCEPTION 'Allocations must be a JSON array';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_allocations) item
    GROUP BY item->>'invoice_id'
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Each invoice may only appear once per allocation request';
  END IF;

  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND OR v_payment.status IN ('cancelled', 'failed', 'refunded') THEN
    RAISE EXCEPTION 'Payment is not available for allocation';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_existing_allocated
  FROM public.payment_allocations
  WHERE payment_id = v_payment.id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations)
  LOOP
    v_invoice_id := (v_item->>'invoice_id')::UUID;
    v_amount := (v_item->>'amount')::NUMERIC;
    IF v_amount IS NULL OR v_amount <= 0 THEN
      RAISE EXCEPTION 'Allocation amount must be positive';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.payment_allocations
      WHERE payment_id = v_payment.id AND invoice_id = v_invoice_id
    ) THEN
      RAISE EXCEPTION 'Payment is already allocated to invoice %', v_invoice_id;
    END IF;
    v_requested_total := v_requested_total + v_amount;
  END LOOP;

  IF v_existing_allocated + v_requested_total > v_payment.amount - COALESCE(v_payment.refunded_amount, 0) THEN
    RAISE EXCEPTION 'Allocated amount exceeds the available payment balance';
  END IF;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_allocations)
    ORDER BY value->>'invoice_id'
  LOOP
    v_invoice_id := (v_item->>'invoice_id')::UUID;
    v_amount := (v_item->>'amount')::NUMERIC;

    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = v_invoice_id
    FOR UPDATE;

    IF NOT FOUND OR v_invoice.status IN ('cancelled', 'refunded') THEN
      RAISE EXCEPTION 'Invoice % is not payable', v_invoice_id;
    END IF;
    IF v_invoice.student_id <> v_payment.student_id THEN
      RAISE EXCEPTION 'Payment and invoice must belong to the same student';
    END IF;
    IF v_amount > v_invoice.total_amount - v_invoice.paid_amount THEN
      RAISE EXCEPTION 'Allocation exceeds invoice % outstanding balance', v_invoice_id;
    END IF;

    INSERT INTO public.payment_allocations(payment_id, invoice_id, amount)
    VALUES (v_payment.id, v_invoice.id, v_amount);

    v_new_paid := v_invoice.paid_amount + v_amount;
    UPDATE public.invoices
    SET paid_amount = v_new_paid,
        status = CASE
          WHEN v_new_paid >= total_amount THEN 'paid'::invoice_status
          ELSE 'partial'::invoice_status
        END,
        updated_at = now()
    WHERE id = v_invoice.id;

    UPDATE public.student_accounts
    SET total_paid = total_paid + v_amount,
        balance = GREATEST(0, balance - v_amount),
        updated_at = now()
    WHERE id = v_invoice.student_account_id;
  END LOOP;

  UPDATE public.payments
  SET status = CASE
        WHEN v_existing_allocated + v_requested_total >= amount - COALESCE(refunded_amount, 0)
          THEN 'completed'::payment_status
        ELSE 'received'::payment_status
      END,
      updated_at = now()
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_payment_atomic(
  p_student_id UUID,
  p_amount NUMERIC,
  p_payment_method_id UUID,
  p_allocations JSONB DEFAULT '[]'::JSONB,
  p_reference_number TEXT DEFAULT NULL,
  p_payment_date DATE DEFAULT current_date,
  p_received_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  IF p_allocations IS NULL OR jsonb_typeof(p_allocations) <> 'array' THEN
    RAISE EXCEPTION 'Allocations must be a JSON array';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'Student does not exist';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.payment_methods
    WHERE id = p_payment_method_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Payment method is not active';
  END IF;

  INSERT INTO public.payments (
    receipt_number, student_id, invoice_id, payment_method_id, amount,
    reference_number, payment_date, received_by, notes, status
  )
  VALUES (
    'BH-PT-' || to_char(COALESCE(p_payment_date, current_date), 'YYYY') || '-' ||
      lpad(nextval('public.finance_receipt_number_seq')::text, 6, '0'),
    p_student_id, NULL, p_payment_method_id, p_amount, p_reference_number,
    COALESCE(p_payment_date, current_date), p_received_by, p_notes, 'received'
  )
  RETURNING * INTO v_payment;

  IF jsonb_array_length(p_allocations) > 0 THEN
    SELECT * INTO v_payment
    FROM public.allocate_student_payment_atomic(v_payment.id, p_allocations);
  END IF;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_student_payment_atomic(UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_student_payment_atomic(UUID, JSONB)
  TO service_role;

REVOKE ALL ON FUNCTION public.record_student_payment_atomic(
  UUID, NUMERIC, UUID, JSONB, TEXT, DATE, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_student_payment_atomic(
  UUID, NUMERIC, UUID, JSONB, TEXT, DATE, UUID, TEXT
) TO service_role;
