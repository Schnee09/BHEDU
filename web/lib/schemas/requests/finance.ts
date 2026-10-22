/**
 * Finance Request Validation Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from 'zod';
import { uuidSchema, dateStringSchema } from '../common';

// Schema for invoice line item
export const createInvoiceItemSchema = z.object({
  fee_type_id: uuidSchema.optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
});

// Schema for creating an invoice manually
export const createInvoiceSchema = z.object({
  student_id: uuidSchema,
  academic_year_id: uuidSchema,
  issue_date: dateStringSchema.optional(),
  due_date: dateStringSchema,
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one item is required'),
});

// Schema for generating bulk invoices for a class
export const bulkGenerateInvoicesSchema = z.object({
  class_id: uuidSchema,
  academic_year_id: uuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Month must be in YYYY-MM-DD format'),
  due_date: dateStringSchema,
  amount: z.number().nonnegative('Amount must be non-negative').optional(),
  description: z.string().max(200).optional(),
});

// Schema for recording a payment
export const recordPaymentSchema = z.object({
  student_id: uuidSchema,
  invoice_id: uuidSchema.optional().nullable(),
  amount: z.number().positive('Payment amount must be positive'),
  payment_method_id: uuidSchema,
  reference_number: z.string().max(100).optional().nullable(),
  payment_date: dateStringSchema.optional(),
  notes: z.string().max(500).optional().nullable(),
});

// Schema for bulk updating the tuition payment matrix
export const tuitionMatrixUpdateItemSchema = z.object({
  studentId: uuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Month must be in YYYY-MM-DD format'),
  paid: z.boolean(),
});

export const tuitionMatrixUpdateSchema = z.object({
  classId: uuidSchema,
  academicYearId: uuidSchema,
  updates: z
    .array(tuitionMatrixUpdateItemSchema)
    .min(1, 'At least one update is required')
    .max(500, 'At most 500 updates are allowed per request')
    .superRefine((updates, context) => {
      const seen = new Set<string>();

      updates.forEach((update, index) => {
        const key = `${update.studentId}:${update.month}`;
        if (seen.has(key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate student and month update',
            path: [index],
          });
        }
        seen.add(key);
      });
    }),
});

export const tuitionRateSchema = z
  .object({
    class_id: uuidSchema,
    academic_year_id: uuidSchema,
    monthly_amount: z.number().nonnegative('Monthly amount must be non-negative'),
    effective_from: dateStringSchema,
    effective_to: dateStringSchema.optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    is_active: z.boolean().optional().default(true),
  })
  .refine((value) => !value.effective_to || value.effective_to >= value.effective_from, {
    message: 'Effective end date must not be before start date',
    path: ['effective_to'],
  });

export const studentTuitionDiscountSchema = z
  .object({
    student_id: uuidSchema,
    class_id: uuidSchema,
    academic_year_id: uuidSchema,
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().nonnegative('Discount value must be non-negative'),
    effective_from: dateStringSchema,
    effective_to: dateStringSchema.optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
    is_active: z.boolean().optional().default(true),
  })
  .refine((value) => value.discount_type !== 'percentage' || value.discount_value <= 100, {
    message: 'Percentage discount cannot exceed 100',
    path: ['discount_value'],
  })
  .refine((value) => !value.effective_to || value.effective_to >= value.effective_from, {
    message: 'Effective end date must not be before start date',
    path: ['effective_to'],
  });

export const refundPaymentSchema = z.object({
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().trim().min(3, 'Refund reason must contain at least 3 characters').max(500),
});

export const cancelInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Cancellation reason must contain at least 3 characters')
    .max(500),
});
