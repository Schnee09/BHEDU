import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createStudentSchema, studentQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';
import { createServiceClient } from '@/lib/supabase/server';
import { StudentRepository } from '@/lib/repositories/StudentRepository';
import { userService } from '@/lib/services/userService';
import { studentService } from '@/lib/services/studentService';

// GET /api/admin/students
export const GET = createGetHandler({ permission: 'students.view' }, async ({ request, user }) => {
  const query = validateQuery(request, studentQuerySchema);
  const queryOpts = { ...query, pageSize: query.limit };
  const isDirectoryRole = ['admin', 'super_admin', 'owner', 'staff'].includes(user.role);

  if (!isDirectoryRole) {
    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);

    if (user.role === 'student') {
      const student = await repository.findById(user.id);
      return apiPaginated(student ? [student] : [], {
        page: 1,
        pageSize: 1,
        total: student ? 1 : 0,
      });
    }

    if (user.role === 'parent') {
      return apiPaginated([], { page: 1, pageSize: 0, total: 0 });
    }

    const { data, ...pagination } = await repository.findByTeacher(user.id, queryOpts);
    return apiPaginated(data, pagination);
  }

  // Center directory roles use the standardized student service and global statistics.
  const result = await studentService.getStudents(queryOpts);

  // Get statistics for the first page
  let statistics = null;
  if (query.page === 1 && !query.search && !query.class_id) {
    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);
    statistics = await repository.countByStatus();
  }

  return apiPaginated(
    result.students,
    {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    },
    { statistics }
  );
});

// POST /api/admin/students
export const POST = createApiHandler(
  {
    permission: 'students.create',
    bodySchema: createStudentSchema,
  },
  async ({ body, user }) => {
    // Note: UserService handles student code generation and profile/auth creation
    const result = await userService.createUser(
      {
        ...body,
        role: 'student',
      } as any,
      user.role,
      user.id
    );

    return apiSuccess(result, {
      message: `Học sinh đã được tạo thành công với mã ${result.student_code}`,
      tempPassword: result.tempPassword,
      _status: 201,
    });
  }
);
