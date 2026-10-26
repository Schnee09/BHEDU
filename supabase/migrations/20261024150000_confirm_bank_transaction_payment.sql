-- Confirm one imported credit transaction as a student payment. The transaction
-- row, payment and invoice allocations are locked/created in one DB transaction.

CREATE OR REPLACE FUNCTION public.confirm_bank_transaction_payment(
  p_transaction_id UUID,
  p_student_id UUID,
  p_payment_method_id UUID,
  p_allocations JSONB DEFAULT '[]'::JSONB,
  p_reviewed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction public.bank_statement_transactions;
  v_payment public.payments;
BEGIN
  SELECT * INTO v_transaction
  FROM public.bank_statement_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy giao dịch ngân hàng';
  END IF;
  IF v_transaction.direction <> 'credit' THEN
    RAISE EXCEPTION 'Chỉ có thể ghi nhận giao dịch tiền vào';
  END IF;
  IF v_transaction.match_status NOT IN ('unmatched', 'suggested', 'needs_review')
     OR v_transaction.matched_payment_id IS NOT NULL THEN
    RAISE EXCEPTION 'Giao dịch này đã được xử lý';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_student_id AND role = 'student' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Học sinh không tồn tại hoặc đã ngừng hoạt động';
  END IF;

  SELECT * INTO v_payment
  FROM public.record_student_payment_atomic(
    p_student_id,
    v_transaction.amount,
    p_payment_method_id,
    COALESCE(p_allocations, '[]'::JSONB),
    COALESCE(v_transaction.reference_number, v_transaction.bank_transaction_id),
    (v_transaction.transaction_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE,
    p_reviewed_by,
    concat_ws(E'\n', NULLIF(trim(COALESCE(p_notes, '')), ''), 'Đối soát từ giao dịch ngân hàng ' || v_transaction.id)
  );

  UPDATE public.bank_statement_transactions
  SET match_status = 'confirmed',
      suggested_student_id = p_student_id,
      matched_payment_id = v_payment.id,
      match_confidence = 1,
      match_reason = jsonb_build_object('type', 'manual_confirmation'),
      reviewed_by = p_reviewed_by,
      reviewed_at = now()
  WHERE id = v_transaction.id;

  RETURN jsonb_build_object(
    'transactionId', v_transaction.id,
    'paymentId', v_payment.id,
    'receiptNumber', v_payment.receipt_number,
    'amount', v_payment.amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_bank_transaction_payment(UUID, UUID, UUID, JSONB, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_bank_transaction_payment(UUID, UUID, UUID, JSONB, UUID, TEXT)
  TO service_role;
