/**
 * Finance Response Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import { invoiceStatusSchema, paymentStatusSchema } from "../common";

export const feeTypeResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    default_amount: z.number(),
    is_mandatory: z.boolean(),
    applies_to: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const invoiceResponseSchema = z.object({
    id: z.string().uuid(),
    student_id: z.string().uuid().nullable(),
    student_account_id: z.string().uuid(),
    academic_year_id: z.string().uuid().nullable(),
    semester: z.string().nullable(),
    due_date: z.string(),
    status: invoiceStatusSchema,
    total_amount: z.number(),
    paid_amount: z.number(),
    discount_amount: z.number(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const paymentResponseSchema = z.object({
    id: z.string().uuid(),
    student_id: z.string().uuid().nullable(),
    student_account_id: z.string().uuid(),
    amount: z.number(),
    payment_date: z.string(),
    payment_method_id: z.string().uuid(),
    status: paymentStatusSchema,
    transaction_reference: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type FeeTypeResponse = z.infer<typeof feeTypeResponseSchema>;
export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
