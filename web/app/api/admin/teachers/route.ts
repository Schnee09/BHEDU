import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createUserSchema, teacherQuerySchema } from '@/lib/schemas';
import { teacherService } from '@/lib/services/teacherService';
import { userService } from '@/lib/services/userService';
import { validateQuery } from '@/lib/api/validation';
import { z } from 'zod';

const createTeachingUserSchema = createUserSchema.extend({
  role: z.enum(['teacher', 'tutor', 'staff']).default('teacher'),
});

/**
 * GET /api/admin/teachers
 * Standardized teacher list with class counts
 */
export const GET = createGetHandler({ permission: 'users.view' }, async ({ request, user }) => {
  const query = validateQuery(request, teacherQuerySchema);

  // Build filter based on schema
  const filters = {
    search: query.search,
    include_staff: query.include_staff,
    teacher_type: query.teacher_type === 'all' ? undefined : (query.teacher_type as any),
  };

  // Note: TeacherService currently doesn't have a paginated list with class counts
  // in a single optimized query. We'll use the existing logic for now but
  // it should be optimized in the service/repository later.
  const result = await teacherService.getTeachersWithStats(filters);
  const teachers = result.data;

  return apiSuccess(
    {
      teachers,
      total: result.total,
    },
    {
      // For backward compatibility with older UI components
      data: teachers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        total_pages: result.totalPages,
      },
    }
  );
});

/**
 * POST /api/admin/teachers
 * Standardized teacher/staff creation
 */
export const POST = createApiHandler(
  {
    permission: 'users.create',
    bodySchema: createTeachingUserSchema,
  },
  async ({ body, user }) => {
    const result = await userService.createUser(body, user.role, user.id);

    return apiSuccess(result, {
      message: 'Người dùng đã được tạo thành công.',
      tempPassword: result.tempPassword,
      _status: 201,
    });
  }
);
