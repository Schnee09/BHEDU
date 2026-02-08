import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { createStudentSchema, studentQuerySchema } from "@/lib/schemas";
import { validateQuery } from "@/lib/api/validation";
import { createServiceClient } from "@/lib/supabase/server";
import { StudentRepository } from "@/lib/repositories/StudentRepository";
import { userService } from "@/lib/services/userService";
import { studentService } from "@/lib/services/studentService";

// GET /api/admin/students
export const GET = createGetHandler(
  { permission: "students.view" },
  async ({ request, user }) => {
    const query = validateQuery(request, studentQuerySchema);

    // Use service for standardized data fetching
    const result = await studentService.getStudents({
      ...query,
      pageSize: query.limit,
    });

    // Get statistics for the first page
    let statistics = null;
    if (query.page === 1 && !query.search && !query.class_id) {
      const supabase = createServiceClient();
      const repository = new StudentRepository(supabase);
      statistics = await repository.countByStatus();
    }

    return apiPaginated(result.students, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    }, { statistics });
  },
);

// POST /api/admin/students
export const POST = createApiHandler(
  {
    permission: "students.create",
    bodySchema: createStudentSchema,
  },
  async ({ body, user }) => {
    // Note: UserService handles student code generation and profile/auth creation
    const result = await userService.createUser(
      {
        ...body,
        role: "student",
      } as any,
      user.role,
      user.id,
    );

    return apiSuccess(result, {
      message: `Học sinh đã được tạo thành công với mã ${result.student_code}`,
      tempPassword: result.tempPassword,
      _status: 201,
    });
  },
);
