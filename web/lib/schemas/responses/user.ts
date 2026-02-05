
import { z } from "zod";
import { 
  userRoleSchema, 
  uuidSchema, 
  timestampSchema, 
  emailSchema,
  phoneSchema, 
  notesSchema, 
  booleanStringSchema 
} from "../common";

/**
 * User response schema (maps to profiles table)
 */
export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  full_name: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: userRoleSchema,
  phone: phoneSchema.optional().nullable(),
  address: z.string().optional().nullable(),
  date_of_birth: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  
  // Status flags
  is_active: z.boolean(),
  is_managed: z.boolean().default(false),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  
  // Academic info
  student_code: z.string().nullable().optional(),
  grade_level: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  teacher_type: z.enum(["full_time", "part_time", "tutor"]).nullable().optional(),
  specialization: z.string().nullable().optional(),
  hourly_rate: z.number().nullable().optional(),
  
  notes: notesSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export type User = z.infer<typeof userSchema>;
