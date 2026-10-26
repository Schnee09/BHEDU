-- Compact operational summary for the Finance "Cần xử lý" queue.

CREATE OR REPLACE FUNCTION public.finance_work_queue_summary(
  p_academic_year_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH allocation_totals AS (
    SELECT payment_id, COALESCE(SUM(amount), 0) AS allocated
    FROM public.payment_allocations
    GROUP BY payment_id
  ), unallocated AS (
    SELECT
      COUNT(*)::INTEGER AS item_count,
      COALESCE(SUM(
        p.amount - COALESCE(p.refunded_amount, 0) - COALESCE(a.allocated, 0)
      ), 0) AS total_amount
    FROM public.payments p
    LEFT JOIN allocation_totals a ON a.payment_id = p.id
    WHERE p.status::TEXT NOT IN ('cancelled', 'failed', 'refunded')
      AND p.amount - COALESCE(p.refunded_amount, 0) - COALESCE(a.allocated, 0) > 0
  ), overdue AS (
    SELECT
      COUNT(*)::INTEGER AS item_count,
      COALESCE(SUM(total_amount - paid_amount), 0) AS total_amount
    FROM public.invoices
    WHERE status::TEXT IN ('pending', 'partial', 'sent', 'overdue')
      AND due_date < current_date
      AND total_amount > paid_amount
      AND (p_academic_year_id IS NULL OR academic_year_id = p_academic_year_id)
  ), statements AS (
    SELECT
      COUNT(*) FILTER (
        WHERE direction = 'credit' AND match_status IN ('unmatched', 'suggested')
      )::INTEGER AS unmatched_count,
      COUNT(*) FILTER (WHERE match_status = 'needs_review')::INTEGER AS review_count
    FROM public.bank_statement_transactions
  ), failed_imports AS (
    SELECT COUNT(*)::INTEGER AS item_count
    FROM public.bank_statement_batches
    WHERE status = 'failed'
  )
  SELECT jsonb_build_object(
    'bankTransactions', statements.unmatched_count,
    'bankNeedsReview', statements.review_count,
    'unallocatedPayments', unallocated.item_count,
    'unallocatedAmount', unallocated.total_amount,
    'overdueInvoices', overdue.item_count,
    'overdueAmount', overdue.total_amount,
    'failedImports', failed_imports.item_count,
    'totalTasks', statements.unmatched_count + statements.review_count +
      unallocated.item_count + overdue.item_count + failed_imports.item_count
  )
  FROM statements, unallocated, overdue, failed_imports;
$$;

REVOKE ALL ON FUNCTION public.finance_work_queue_summary(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finance_work_queue_summary(UUID) TO service_role;
