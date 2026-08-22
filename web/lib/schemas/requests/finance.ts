/**
 * Finance Request Validation Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import { uuidSchema, dateStringSchema } from "../common";

// Schema for invoice line item
export const createInvoiceItemSchema = z.object({
  fee_type_id: uuidSchema.optional().nullable(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().nonnegative("Unit price must be non-negative"),
});

// Schema for creating an invoice manually
export const createInvoiceSchema = z.object({
  student_id: uuidSchema,
  academic_year_id: uuidSchema,
  issue_date: dateStringSchema.optional(),
  due_date: dateStringSchema,
  total_amount: z.number().nonnegative("Total amount must be non-negative"),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(createInvoiceItemSchema).min(1, "At least one item is required"),
});

// Schema for generating bulk invoices for a class
export const bulkGenerateInvoicesSchema = z.object({
  class_id: uuidSchema,
  academic_year_id: uuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Month must be in YYYY-MM-DD format"),
  due_date: dateStringSchema,
  amount: z.number().nonnegative("Amount must be non-negative").optional(),
  description: z.string().max(200).optional(),
});

// Schema for recording a payment
export const recordPaymentSchema = z.object({
  student_id: uuidSchema,
  invoice_id: uuidSchema.optional().nullable(),
  amount: z.number().positive("Payment amount must be positive"),
  payment_method_id: uuidSchema,
  reference_number: z.string().max(100).optional().nullable(),
  payment_date: dateStringSchema.optional(),
  notes: z.string().max(500).optional().nullable(),
});

// Schema for bulk updating the tuition payment matrix
export const tuitionMatrixUpdateItemSchema = z.object({
  studentId: uuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Month must be in YYYY-MM-DD format"),
  paid: z.boolean(),
});

export const tuitionMatrixUpdateSchema = z.object({
  classId: uuidSchema,
  academicYearId: uuidSchema,
  updates: z.array(tuitionMatrixUpdateItemSchema).min(1, "At least one update is required"),
});
