-- Monthly tuition finance foundation.
-- Keeps existing finance data intact while adding class-scoped billing,
-- discounts, receipt numbers, and atomic write operations.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_period DATE,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE public.invoices
SET billing_period = date_trunc('month', issue_date)::date
WHERE billing_period IS NULL;

UPDATE public.invoices
SET gross_amount = total_amount + COALESCE(discount_amount, 0)
WHERE gross_amount IS NULL;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_discount_amount_nonnegative
  CHECK (discount_amount >= 0) NOT VALID;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_gross_amount_nonnegative
  CHECK (gross_amount IS NULL OR gross_amount >= 0) NOT VALID;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_discount_not_above_gross
  CHECK (gross_amount IS NULL OR discount_amount <= gross_amount) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_invoices_class_period_student
  ON public.invoices(class_id, billing_period, student_id)
  WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS public.class_tuition_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(12, 2) NOT NULL CHECK (monthly_amount >= 0),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE (class_id, academic_year_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_class_tuition_rates_lookup
  ON public.class_tuition_rates(class_id, academic_year_id, effective_from DESC)
  WHERE is_active = true;

-- Preserve configured tuition amounts by promoting existing class assignments
-- into effective-dated monthly rates. Non-tuition fees remain invoice line items.
INSERT INTO public.class_tuition_rates (
  class_id,
  academic_year_id,
  monthly_amount,
  effective_from,
  notes
)
SELECT
  fa.class_id,
  fa.academic_year_id,
  SUM(fa.amount),
  COALESCE(ay.start_date, current_date),
  'Migrated from fee assignments'
FROM public.fee_assignments fa
JOIN public.fee_types ft ON ft.id = fa.fee_type_id
JOIN public.academic_years ay ON ay.id = fa.academic_year_id
WHERE fa.class_id IS NOT NULL
  AND fa.is_active = true
  AND ft.category::text = 'tuition'
GROUP BY fa.class_id, fa.academic_year_id, ay.start_date
ON CONFLICT (class_id, academic_year_id, effective_from) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.student_tuition_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value >= 0),
  effective_from DATE NOT NULL,
  effective_to DATE,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CHECK (discount_type <> 'percentage' OR discount_value <= 100),
  UNIQUE (student_id, class_id, academic_year_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_student_tuition_discounts_lookup
  ON public.student_tuition_discounts(student_id, class_id, academic_year_id, effective_from DESC)
  WHERE is_active = true;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tuition_discount_id UUID
  REFERENCES public.student_tuition_discounts(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS trigger_updated_at ON public.class_tuition_rates;
CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON public.class_tuition_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_updated_at ON public.student_tuition_discounts;
CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON public.student_tuition_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.class_tuition_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tuition_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance staff manage tuition rates" ON public.class_tuition_rates;
CREATE POLICY "Finance staff manage tuition rates"
  ON public.class_tuition_rates
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

DROP POLICY IF EXISTS "Finance staff manage student discounts"
  ON public.student_tuition_discounts;
CREATE POLICY "Finance staff manage student discounts"
  ON public.student_tuition_discounts
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_tuition_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_tuition_discounts TO authenticated;
GRANT ALL ON public.class_tuition_rates TO service_role;
GRANT ALL ON public.student_tuition_discounts TO service_role;

CREATE SEQUENCE IF NOT EXISTS public.finance_invoice_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.finance_receipt_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.finance_refund_number_seq;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_refunded_amount_valid
  CHECK (refunded_amount >= 0 AND refunded_amount <= amount) NOT VALID;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt_number
  ON public.payments(receipt_number)
  WHERE receipt_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_number TEXT NOT NULL UNIQUE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  refunded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment
  ON public.payment_refunds(payment_id, refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_invoice
  ON public.payment_refunds(invoice_id, refunded_at DESC);

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance staff view refunds" ON public.payment_refunds;
CREATE POLICY "Finance staff view refunds"
  ON public.payment_refunds FOR SELECT TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'owner', 'admin', 'staff'));
GRANT SELECT ON public.payment_refunds TO authenticated;
GRANT ALL ON public.payment_refunds TO service_role;

CREATE OR REPLACE FUNCTION public.create_monthly_tuition_invoice(
  p_student_id UUID,
  p_class_id UUID,
  p_academic_year_id UUID,
  p_billing_period DATE,
  p_due_date DATE,
  p_gross_amount NUMERIC DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period DATE := date_trunc('month', p_billing_period)::date;
  v_gross NUMERIC(12, 2);
  v_discount NUMERIC(12, 2);
  v_account public.student_accounts;
  v_invoice public.invoices;
  v_discount_rule public.student_tuition_discounts;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_student_id::text || ':' || p_class_id::text || ':' || v_period::text, 0)
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.student_id = p_student_id
      AND e.class_id = p_class_id
      AND e.status = 'enrolled'
  ) THEN
    RAISE EXCEPTION 'Student is not actively enrolled in this class';
  END IF;

  SELECT i.* INTO v_invoice
  FROM public.invoices i
  WHERE i.student_id = p_student_id
    AND i.class_id = p_class_id
    AND i.billing_period = v_period
    AND i.status <> 'cancelled'
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_invoice;
  END IF;

  IF p_gross_amount IS NULL THEN
    SELECT r.monthly_amount INTO v_gross
    FROM public.class_tuition_rates r
    WHERE r.class_id = p_class_id
      AND r.academic_year_id = p_academic_year_id
      AND r.is_active = true
      AND r.effective_from <= v_period
      AND (r.effective_to IS NULL OR r.effective_to >= v_period)
    ORDER BY r.effective_from DESC
    LIMIT 1;
  ELSE
    v_gross := p_gross_amount;
  END IF;

  IF v_gross IS NULL OR v_gross < 0 THEN
    RAISE EXCEPTION 'No valid monthly tuition rate is configured';
  END IF;

  IF p_discount_amount IS NULL THEN
    SELECT d.* INTO v_discount_rule
    FROM public.student_tuition_discounts d
    WHERE d.student_id = p_student_id
      AND d.class_id = p_class_id
      AND d.academic_year_id = p_academic_year_id
      AND d.is_active = true
      AND d.effective_from <= v_period
      AND (d.effective_to IS NULL OR d.effective_to >= v_period)
    ORDER BY d.effective_from DESC
    LIMIT 1;

    v_discount := CASE v_discount_rule.discount_type
      WHEN 'percentage' THEN round(v_gross * v_discount_rule.discount_value / 100, 2)
      WHEN 'fixed' THEN v_discount_rule.discount_value
      ELSE 0
    END;
  ELSE
    v_discount := p_discount_amount;
  END IF;

  v_discount := LEAST(v_gross, GREATEST(COALESCE(v_discount, 0), 0));

  INSERT INTO public.student_accounts (
    student_id, academic_year_id, balance, total_fees, total_paid, status
  )
  VALUES (p_student_id, p_academic_year_id, 0, 0, 0, 'active')
  ON CONFLICT (student_id, academic_year_id) DO NOTHING;

  SELECT * INTO v_account
  FROM public.student_accounts
  WHERE student_id = p_student_id
    AND academic_year_id = p_academic_year_id
  FOR UPDATE;

  INSERT INTO public.invoices (
    invoice_number,
    student_id,
    student_account_id,
    academic_year_id,
    class_id,
    billing_period,
    issue_date,
    due_date,
    gross_amount,
    discount_amount,
    tuition_discount_id,
    total_amount,
    paid_amount,
    status,
    notes
  )
  VALUES (
    'BH-HD-' || to_char(current_date, 'YYYY') || '-' ||
      lpad(nextval('public.finance_invoice_number_seq')::text, 6, '0'),
    p_student_id,
    v_account.id,
    p_academic_year_id,
    p_class_id,
    v_period,
    current_date,
    p_due_date,
    v_gross,
    v_discount,
    v_discount_rule.id,
    v_gross - v_discount,
    0,
    'pending',
    p_notes
  )
  RETURNING * INTO v_invoice;

  INSERT INTO public.invoice_items (
    invoice_id, description, quantity, unit_price, total_price
  )
  VALUES (
    v_invoice.id,
    COALESCE(p_description, 'Học phí tháng ' || to_char(v_period, 'MM/YYYY')),
    1,
    v_gross,
    v_gross
  );

  IF v_discount > 0 THEN
    INSERT INTO public.invoice_items (
      invoice_id, description, quantity, unit_price, total_price
    )
    VALUES (v_invoice.id, 'Giảm học phí', 1, -v_discount, -v_discount);
  END IF;

  UPDATE public.student_accounts
  SET total_fees = total_fees + v_invoice.total_amount,
      balance = balance + v_invoice.total_amount,
      updated_at = now()
  WHERE id = v_account.id;

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_invoice_payment_atomic(
  p_invoice_id UUID,
  p_amount NUMERIC,
  p_payment_method_id UUID,
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
  v_invoice public.invoices;
  v_payment public.payments;
  v_new_paid NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND OR v_invoice.status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invoice is not payable';
  END IF;

  IF p_amount <= 0 OR p_amount > (v_invoice.total_amount - v_invoice.paid_amount) THEN
    RAISE EXCEPTION 'Payment amount exceeds the outstanding balance';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.payment_methods
    WHERE id = p_payment_method_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Payment method is not active';
  END IF;

  INSERT INTO public.payments (
    receipt_number,
    student_id,
    invoice_id,
    payment_method_id,
    amount,
    reference_number,
    payment_date,
    received_by,
    notes,
    status
  )
  VALUES (
    'BH-PT-' || to_char(COALESCE(p_payment_date, current_date), 'YYYY') || '-' ||
      lpad(nextval('public.finance_receipt_number_seq')::text, 6, '0'),
    v_invoice.student_id,
    v_invoice.id,
    p_payment_method_id,
    p_amount,
    p_reference_number,
    COALESCE(p_payment_date, current_date),
    p_received_by,
    p_notes,
    'completed'
  )
  RETURNING * INTO v_payment;

  INSERT INTO public.payment_allocations(payment_id, invoice_id, amount)
  VALUES (v_payment.id, v_invoice.id, p_amount);

  v_new_paid := v_invoice.paid_amount + p_amount;

  UPDATE public.invoices
  SET paid_amount = v_new_paid,
      status = CASE
        WHEN v_new_paid >= total_amount THEN 'paid'::invoice_status
        ELSE 'partial'::invoice_status
      END,
      updated_at = now()
  WHERE id = v_invoice.id;

  UPDATE public.student_accounts
  SET total_paid = total_paid + p_amount,
      balance = GREATEST(0, balance - p_amount),
      updated_at = now()
  WHERE id = v_invoice.student_account_id;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.create_monthly_tuition_invoice(
  UUID, UUID, UUID, DATE, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_monthly_tuition_invoice(
  UUID, UUID, UUID, DATE, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.record_invoice_payment_atomic(
  UUID, NUMERIC, UUID, TEXT, DATE, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment_atomic(
  UUID, NUMERIC, UUID, TEXT, DATE, UUID, TEXT
) TO service_role;

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
  v_invoice public.invoices;
  v_refund public.payment_refunds;
  v_remaining NUMERIC(12, 2);
  v_new_invoice_paid NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND OR v_payment.invoice_id IS NULL OR v_payment.status IN ('cancelled', 'failed') THEN
    RAISE EXCEPTION 'Payment is not refundable';
  END IF;

  v_remaining := v_payment.amount - COALESCE(v_payment.refunded_amount, 0);
  IF p_amount <= 0 OR p_amount > v_remaining THEN
    RAISE EXCEPTION 'Refund amount exceeds the refundable balance';
  END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'Refund reason is required';
  END IF;

  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = v_payment.invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice does not exist';
  END IF;

  INSERT INTO public.payment_refunds (
    refund_number, payment_id, invoice_id, amount, reason, refunded_by
  )
  VALUES (
    'BH-HT-' || to_char(current_date, 'YYYY') || '-' ||
      lpad(nextval('public.finance_refund_number_seq')::text, 6, '0'),
    v_payment.id,
    v_invoice.id,
    p_amount,
    trim(p_reason),
    p_refunded_by
  )
  RETURNING * INTO v_refund;

  UPDATE public.payments
  SET refunded_amount = refunded_amount + p_amount,
      status = CASE
        WHEN refunded_amount + p_amount >= amount THEN 'refunded'::payment_status
        ELSE status
      END,
      updated_at = now()
  WHERE id = v_payment.id;

  v_new_invoice_paid := GREATEST(0, v_invoice.paid_amount - p_amount);
  UPDATE public.invoices
  SET paid_amount = v_new_invoice_paid,
      status = CASE
        WHEN v_new_invoice_paid <= 0 THEN 'pending'::invoice_status
        WHEN v_new_invoice_paid < total_amount THEN 'partial'::invoice_status
        ELSE 'paid'::invoice_status
      END,
      updated_at = now()
  WHERE id = v_invoice.id;

  UPDATE public.student_accounts
  SET total_paid = GREATEST(0, total_paid - p_amount),
      balance = balance + p_amount,
      updated_at = now()
  WHERE id = v_invoice.student_account_id;

  RETURN v_refund;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_unpaid_invoice_atomic(
  p_invoice_id UUID,
  p_reason TEXT,
  p_cancelled_by UUID DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.invoices;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND OR v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice cannot be cancelled';
  END IF;
  IF v_invoice.paid_amount > 0 THEN
    RAISE EXCEPTION 'Refund all invoice payments before cancellation';
  END IF;
  IF length(trim(COALESCE(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;

  UPDATE public.invoices
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      cancellation_reason = trim(p_reason),
      updated_at = now()
  WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  UPDATE public.student_accounts
  SET total_fees = GREATEST(0, total_fees - v_invoice.total_amount),
      balance = GREATEST(0, balance - v_invoice.total_amount),
      updated_at = now()
  WHERE id = v_invoice.student_account_id;

  RETURN v_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_payment_atomic(UUID, NUMERIC, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_payment_atomic(UUID, NUMERIC, TEXT, UUID)
  TO service_role;

REVOKE ALL ON FUNCTION public.cancel_unpaid_invoice_atomic(UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_invoice_atomic(UUID, TEXT, UUID)
  TO service_role;
