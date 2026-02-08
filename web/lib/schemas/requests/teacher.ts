/**
 * Teacher Request Schemas
 * Aligned with BH-EDU v5.0 Architecture
 */

import { z } from "zod";
import { booleanStringSchema, paginationWithDefaults } from "../common";

/**
 * Teacher query parameters
 */
export const teacherQuerySchema = z.object({
    ...paginationWithDefaults(100).shape,
    search: z.string().optional(),
    include_staff: booleanStringSchema.optional().default(true),
    department: z.string().optional(),
    teacher_type: z.enum(["full_time", "part_time", "tutor", "all"]).optional()
        .default("all"),
});

export type TeacherQueryInput = z.infer<typeof teacherQuerySchema>;
