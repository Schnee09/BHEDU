import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { teacherService } from '@/lib/services/teacherService';
import { z } from 'zod';

/**
 * GET /api/teachers - List all classroom teachers
 */
export const GET = createGetHandler({}, async ({ searchParams }) => {
  const search = searchParams.get('search') || undefined;
  const department = searchParams.get('department') || undefined;

  const teachers = await teacherService.getTeachers({ search, department });
  return apiSuccess({ teachers });
});

/**
 * POST /api/teachers - Create new classroom teacher
 */
export const POST = createApiHandler(
  {
    permission: 'users.create',
    bodySchema: z.object({
      full_name: z.string().min(1, 'Vui lòng nhập họ và tên'),
      email: z.string().email('Email không hợp lệ').optional().nullable(),
      phone: z.string().optional().nullable(),
      teacher_code: z.string().optional().nullable(),
      department: z.string().optional().nullable(),
      specialization: z.string().optional().nullable(),
      bio: z.string().optional().nullable(),
    }),
  },
  async ({ body }) => {
    const teacher = await teacherService.createTeacher(body);
    return apiSuccess({ teacher }, { message: 'Giáo viên đã được tạo thành công' });
  }
);
