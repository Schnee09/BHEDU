import { apiSuccess, createApiHandler } from "@/lib/api/apiHandler";
import { studentService } from "@/lib/services/studentService";
import { studentLookupSchema } from "@/lib/schemas";

export const POST = createApiHandler({
  requireAuth: false, // Lookup can be public (only returns public-ish info)
  bodySchema: studentLookupSchema,
}, async ({ body }) => {
  const student = await studentService.getStudentByCode(body.student_code);

  return apiSuccess({
    id: student.id,
    email: student.email,
    full_name: student.full_name,
    student_code: student.student_code,
    role: "student",
  });
});
