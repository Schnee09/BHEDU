/**
 * Validation schemas for Finance-related API requests
 */

import { z } from 'zod';

/**
 * Payment creation schema
 */
export const createPaymentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  student_account_id: z.string().uuid('Invalid student account ID').optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().date('Invalid payment date').optional(),
  payment_method_id: z.string().uuid('Invalid payment method ID'),
  transaction_reference: z.string().max(100).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  academic_year_id: z.string().uuid('Invalid academic year ID').optional(),
  allocations: z.array(
    z.object({
      invoice_id: z.string().uuid('Invalid invoice ID'),
      amount: z.number().positive('Allocation amount must be positive'),
    })
  ).optional(),
});

/**
 * Payment update schema
 */
export const updatePaymentSchema = z.object({
  id: z.string().uuid('Invalid payment ID'),
  amount: z.number().positive().optional(),
  payment_date: z.string().date().optional(),
  payment_method_id: z.string().uuid().optional(),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
});

/**
 * Invoice creation schema
 */
export const createInvoiceSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  semester: z.enum(['1', '2', 'full_year']).optional(),
  due_date: z.string().date('Invalid due date'),
  items: z.array(
    z.object({
      fee_type_id: z.string().uuid('Invalid fee type ID'),
      description: z.string().min(1, 'Description is required').max(200),
      amount: z.number().positive('Amount must be positive'),
      quantity: z.number().int().positive().default(1),
    })
  ).min(1, 'At least one item is required'),
  discount_amount: z.number().min(0).optional().default(0),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Fee type creation schema
 */
export const createFeeTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  default_amount: z.number().positive('Default amount must be positive'),
  is_mandatory: z.boolean().optional().default(false),
  applies_to: z.enum(['all', 'grade_level', 'class', 'individual']).optional().default('all'),
  academic_year_id: z.string().uuid().optional().nullable(),
});

/**
 * Student account query schema
 */
export const studentAccountQuerySchema = z.object({
  student_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
  status: z.enum(['paid', 'partially_paid', 'unpaid', 'overdue', 'all']).optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('25').transform(Number),
  sort: z.enum(['amount', 'due_date', 'student_name']).optional().default('due_date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Payment method schema
 */
export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  requires_reference: z.boolean().optional().default(false),
});

/**
 * Financial report query schema
 */
export const financialReportQuerySchema = z.object({
  start_date: z.string().date('Invalid start date'),
  end_date: z.string().date('Invalid end date'),
  academic_year_id: z.string().uuid().optional(),
  report_type: z.enum(['summary', 'detailed', 'by_class', 'by_fee_type']).optional().default('summary'),
  include_pending: z.string().optional().transform(val => val === 'true'),
});

/**
 * Bulk payment allocation schema
 */
export const bulkPaymentAllocationSchema = z.object({
  payment_id: z.string().uuid('Invalid payment ID'),
  allocations: z.array(
    z.object({
      invoice_id: z.string().uuid('Invalid invoice ID'),
      amount: z.number().positive('Amount must be positive'),
    })
  ).min(1, 'At least one allocation is required'),
});
