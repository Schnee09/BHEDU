-- Validate monthly tuition against the enrollment period instead of the
-- student's current enrollment status. This keeps historical billing valid
-- after a student leaves or transfers class.

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
  v_period_end DATE := (date_trunc('month', p_billing_period) + interval '1 month - 1 day')::date;
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
      AND e.deleted_at IS NULL
      AND e.enrollment_date <= v_period_end
      AND (e.end_date IS NULL OR e.end_date >= v_period)
  ) THEN
    RAISE EXCEPTION 'Student enrollment does not overlap the billing period';
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
      AND r.effective_from <= v_period_end
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
      AND d.effective_from <= v_period_end
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

REVOKE ALL ON FUNCTION public.create_monthly_tuition_invoice(
  UUID, UUID, UUID, DATE, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_monthly_tuition_invoice(
  UUID, UUID, UUID, DATE, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) TO service_role;
