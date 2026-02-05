import { z } from "zod";
import {
  booleanStringSchema,
  createSortSchema,
  emailSchema,
  notesSchema,
  optionalEmailSchema,
  paginationWithDefaults,
  phoneSchema,
  userRoleSchema,
  uuidSchema,
} from "../common";

// ============================================
// USER REQUEST SCHEMAS
// ============================================

/**
 * User query parameters
 */
export const userQuerySchema = z.object({
  ...paginationWithDefaults(50).shape,
  ...createSortSchema([
    "created_at",
    "updated_at",
    "email",
    "full_name",
    "role",
    "status",
  ], "created_at").shape,
  search: z.string().optional(),
  role: userRoleSchema.optional().or(z.literal("all")),
  status: z.enum(["active", "inactive", "suspended"]).optional().or(
    z.literal("all"),
  ),
  is_active: booleanStringSchema,
  department: z.string().optional(),
});

/**
 * User creation schema
 */
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(8, "Password must be at least 8 characters")
    .optional(),
  full_name: z.string().min(1, "Full name is required").max(200).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  role: userRoleSchema,
  phone: phoneSchema.optional().nullable(),
  status: z.enum(["active", "inactive", "suspended"]).optional().default(
    "active",
  ),
  address: z.string().max(255).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),

  personal_email: z.string().email("Invalid personal email format").optional()
    .nullable(),

  // Role specific fields
  notes: notesSchema,
  student_code: z.string().max(50).optional(),
  grade_level: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  teacher_type: z.enum(["full_time", "part_time", "tutor"]).optional(),
  specialization: z.string().max(100).optional(),
  hourly_rate: z.number().nonnegative().optional(),

  // Is managed by system (vs external auth)
  is_managed: z.boolean().optional().default(true),
});

/**
 * User update schema
 */
export const updateUserSchema = createUserSchema.partial().omit({
  password: true, // Password update handled separately
}).extend({
  id: uuidSchema.optional(),
  is_active: z.boolean().optional(),
});

/**
 * User profile update schema (self-service)
 */
export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: phoneSchema.optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Bulk user import schema
 */
export const importUsersSchema = z.object({
  users: z.array(
    z.object({
      email: emailSchema,
      password: z.string().optional(),
      full_name: z.string().min(1),
      role: userRoleSchema, // Use schema for enum validation
      phone: phoneSchema.optional().nullable(),
      is_active: booleanStringSchema.optional().or(z.boolean().optional()),
      notes: notesSchema,

      // Role specific
      student_id: z.string().optional(),
      grade_level: z.string().optional(),
      department: z.string().optional(),
    }),
  ).min(1, "At least one user is required").max(
    100,
    "Maximum 100 users per import",
  ),
});

export type ImportUsersInput = z.infer<typeof importUsersSchema>;
