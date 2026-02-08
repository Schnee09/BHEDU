/**
 * Auth Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";

/**
 * Login schema
 */
export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    remember: z.boolean().optional().default(false),
});

/**
 * Student lookup schema (public)
 */
export const studentLookupSchema = z.object({
    student_code: z.string().min(1, "Student code is required"),
});

/**
 * Signup schema
 */
export const signupSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().min(1, "Last name is required").max(100),
    role: z.enum(["student", "teacher", "admin"]).optional().default("student"),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
    email: z.string().email("Invalid email format"),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordResetRequestInput = z.infer<
    typeof passwordResetRequestSchema
>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
