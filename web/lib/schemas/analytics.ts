import { z } from "zod";
import { paginationSchema } from "./common";
import { dateSchema, uuidSchema } from "./validation.schemas";

// Re-export common schemas to avoid breaking changes if they were imported from here
export { dateSchema, paginationSchema, uuidSchema };

export const analyticsQuerySchema = z.object({
    academicYear: z.string().optional(),
    semester: z.string().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
