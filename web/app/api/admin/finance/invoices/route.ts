/**
 * Admin Invoices API
 * GET /api/admin/finance/invoices
 * POST /api/admin/finance/invoices
 */

import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { financeService } from '@/lib/services';
import { createInvoiceSchema } from '@/lib/schemas';
import { ValidationError } from '@/lib/api/errors';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const search = searchParams.get('search') || undefined;
  const classId = searchParams.get('class_id') || undefined;
  const status = searchParams.get('status') || undefined;
  const month = searchParams.get('month') || undefined;
  const academicYearId = searchParams.get('academic_year_id') || undefined;
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '25');
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('limit must be an integer between 1 and 100');
  }

  const result = await financeService.getInvoices({
    search,
    classId,
    status,
    month,
    academicYearId,
    page,
    pageSize: limit,
  });

  return apiPaginated(result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  });
});

export const POST = createApiHandler(
  {
    permission: 'finance.manage',
    bodySchema: createInvoiceSchema,
  },
  async ({ body }) => {
    // Call createInvoiceWithItems using the custom repo logic on financeService
    const result = await (financeService as any).financeRepository.createInvoiceWithItems(
      {
        student_id: body.student_id,
        academic_year_id: body.academic_year_id,
        issue_date: body.issue_date,
        due_date: body.due_date,
        total_amount: body.total_amount,
        notes: body.notes,
      },
      body.items
    );

    return apiSuccess(result, { _status: 201 });
  }
);
