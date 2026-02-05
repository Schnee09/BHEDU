/**
 * Validation schemas for Finance-related API requests
 */

import { z } from "zod";
import {
  createSortSchema,
  dateStringSchema,
  invoiceStatusSchema,
  notesSchema,
  paginationWithDefaults,
  paymentStatusSchema,
  timestampSchema,
  uuidSchema,
} from "./common";

// ============================================
// FEE TYPES
// ============================================

export const createFeeTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: notesSchema,
  default_amount: z.number().positive("Default amount must be positive"),
  is_mandatory: z.boolean().optional().default(false),
  applies_to: z.enum(["all", "grade_level", "class", "individual"]).optional()
    .default("all"),
  academic_year_id: uuidSchema.optional().nullable(),
});

export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>;

// ============================================
// INVOICES
// ============================================

export const createInvoiceSchema = z.object({
  student_id: uuidSchema.optional().nullable(),
  student_account_id: uuidSchema,
  academic_year_id: uuidSchema.optional().nullable(),
  semester: z.enum(["1", "2", "full_year"]).optional(),
  due_date: dateStringSchema,
  items: z.array(
    z.object({
      fee_type_id: uuidSchema,
      description: z.string().min(1, "Description is required").max(200),
      amount: z.number().positive("Amount must be positive"),
      quantity: z.number().int().positive().default(1),
    }),
  ).min(1, "At least one item is required"),
  discount_amount: z.number().min(0).optional().default(0),
  notes: notesSchema,
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: invoiceStatusSchema.optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ============================================
// PAYMENTS
// ============================================

/**
 * Payment method schema
 */
export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: notesSchema,
  is_active: z.boolean().optional().default(true),
  // For basic QR support, we can add simple bank details here or separate settings
  bank_name: z.string().max(100).optional().nullable(),
  account_number: z.string().max(50).optional().nullable(),
  account_holder: z.string().max(100).optional().nullable(),
  qr_template: z.string().optional().nullable(), // E.g. "compact2", "qr_only" for VietQR
});

export const createPaymentSchema = z.object({
  student_id: uuidSchema.optional().nullable(),
  student_account_id: uuidSchema,
  amount: z.number().positive("Amount must be positive"),
  payment_date: dateStringSchema.optional(),
  payment_method_id: uuidSchema,
  transaction_reference: z.string().max(100).optional().nullable(),
  notes: notesSchema,
  allocations: z.array(
    z.object({
      invoice_id: uuidSchema,
      amount: z.number().positive(),
    }),
  ).optional(),
});

export const updatePaymentSchema = z.object({
  status: paymentStatusSchema.optional(),
  notes: notesSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ============================================
// QUERIES
// ============================================

export const financialReportQuerySchema = z.object({
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  academic_year_id: uuidSchema.optional(),
  report_type: z.enum(["summary", "detailed", "by_class", "by_fee_type"])
    .optional().default("summary"),
});

export const studentAccountQuerySchema = z.object({
  ...paginationWithDefaults(25).shape,
  student_id: uuidSchema.optional(),
  status: invoiceStatusSchema.optional().or(z.literal("all")),
  // Allow 'all' or specific status. Using union.
  academic_year_id: uuidSchema.optional(),
});

// ============================================
// BANK SETTINGS (QR Support)
// ============================================

export const bankSettingsSchema = z.object({
  bank_bin: z.string().min(1, "Bank BIN is required"),
  bank_name: z.string().optional(),
  account_number: z.string().min(1, "Account number is required"),
  account_name: z.string().min(1, "Account name is required"),
  template: z.enum(["compact", "compact2", "qr_only", "print"]).default(
    "compact2",
  ),
});

export type BankSettingsInput = z.infer<typeof bankSettingsSchema>;

// Legacy exports for compatibility until full migration
export const bulkPaymentAllocationSchema = z.object({
  payment_id: z.string(),
  allocations: z.array(z.any()),
});
