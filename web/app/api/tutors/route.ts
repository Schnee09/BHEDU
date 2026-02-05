import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api/apiHandler";
import { teacherService } from "@/lib/services/teacherService";
import { z } from "zod";

/**
 * GET /api/tutors - List all tutors
 */
export const GET = createGetHandler({}, async ({ searchParams }) => {
  const search = searchParams.get("search") || undefined;
  const tutors = await teacherService.getTutors({ search });
  return apiSuccess({ tutors });
});

/**
 * POST /api/tutors - Create new tutor
 */
export const POST = createApiHandler({
  permission: "users.create",
  bodySchema: z.object({
    full_name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    specialization: z.string().optional(),
    teaching_subjects: z.array(z.string()).optional(),
    hourly_rate: z.number().min(0).optional(),
    bio: z.string().optional(),
  }),
}, async ({ body }) => {
  const tutor = await teacherService.createTutor(body);
  return apiSuccess({ tutor }, { message: "Gia sư đã được tạo thành công" });
});
