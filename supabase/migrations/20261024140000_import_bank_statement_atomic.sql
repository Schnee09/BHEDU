-- Atomically persist one validated statement file. The API parses and validates
-- the source again before calling this function; database constraints remain the
-- final protection against duplicate files and transactions.

CREATE OR REPLACE FUNCTION public.import_bank_statement(
  p_file_name TEXT,
  p_file_hash TEXT,
  p_bank_code TEXT,
  p_account_scope TEXT,
  p_imported_by UUID,
  p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_total_rows INTEGER := jsonb_array_length(COALESCE(p_rows, '[]'::JSONB));
  v_imported_rows INTEGER := 0;
BEGIN
  IF trim(COALESCE(p_file_name, '')) = '' OR trim(COALESCE(p_file_hash, '')) = '' THEN
    RAISE EXCEPTION 'Tên file và mã kiểm tra file là bắt buộc';
  END IF;

  IF v_total_rows = 0 THEN
    RAISE EXCEPTION 'Không có giao dịch hợp lệ để nhập';
  END IF;

  -- Serialize imports of the same file, including concurrent requests.
  PERFORM pg_advisory_xact_lock(hashtextextended('bank-statement:' || p_file_hash, 0));

  IF EXISTS (
    SELECT 1 FROM public.bank_statement_batches
    WHERE source = 'file' AND file_hash = p_file_hash
  ) THEN
    RAISE EXCEPTION 'File sao kê này đã được nhập trước đó' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.bank_statement_batches (
    source, bank_code, account_number_masked, file_name, file_hash,
    statement_from, statement_to, total_rows, imported_by, status
  )
  SELECT
    'file', NULLIF(trim(p_bank_code), ''), NULLIF(trim(p_account_scope), ''),
    p_file_name, p_file_hash,
    min((item->>'transactionAt')::TIMESTAMPTZ)::DATE,
    max((item->>'transactionAt')::TIMESTAMPTZ)::DATE,
    v_total_rows, p_imported_by, 'processing'
  FROM jsonb_array_elements(p_rows) AS item
  RETURNING id INTO v_batch_id;

  INSERT INTO public.bank_statement_transactions (
    batch_id, row_number, transaction_at, amount, direction, description,
    reference_number, counterparty_name, counterparty_account,
    bank_transaction_id, fingerprint, raw_data
  )
  SELECT
    v_batch_id,
    (item->>'rowNumber')::INTEGER,
    (item->>'transactionAt')::TIMESTAMPTZ,
    (item->>'amount')::NUMERIC,
    COALESCE(NULLIF(item->>'direction', ''), 'credit'),
    NULLIF(item->>'description', ''),
    NULLIF(item->>'referenceNumber', ''),
    NULLIF(item->>'counterpartyName', ''),
    NULLIF(item->>'counterpartyAccount', ''),
    NULLIF(item->>'bankTransactionId', ''),
    item->>'fingerprint',
    COALESCE(item->'rawData', '{}'::JSONB)
  FROM jsonb_array_elements(p_rows) AS item
  ON CONFLICT (fingerprint) DO NOTHING;

  GET DIAGNOSTICS v_imported_rows = ROW_COUNT;

  UPDATE public.bank_statement_batches
  SET imported_rows = v_imported_rows,
      duplicate_rows = v_total_rows - v_imported_rows,
      status = 'completed',
      completed_at = now()
  WHERE id = v_batch_id;

  RETURN jsonb_build_object(
    'batchId', v_batch_id,
    'totalRows', v_total_rows,
    'importedRows', v_imported_rows,
    'duplicateRows', v_total_rows - v_imported_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_bank_statement(TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_bank_statement(TEXT, TEXT, TEXT, TEXT, UUID, JSONB)
  TO service_role;
