import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { updateStudentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';
import { studentService } from '@/lib/services/studentService';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { AuthorizationError } from '@/lib/api/errors';

const GLOBAL_STUDENT_DIRECTORY_ROLES = new Set(['super_admin', 'owner', 'admin', 'staff']);

// GET /api/admin/students/[id]
export const GET = createGetHandler({ permission: 'students.view' }, async ({ params, user }) => {
  const id = params.id as string;
  const supabase = createServiceClient();
  const canViewStudent =
    GLOBAL_STUDENT_DIRECTORY_ROLES.has(user.role) ||
    (await canAccessStudent(supabase, { id: user.id, role: user.role }, id));
  if (!canViewStudent) {
    throw new AuthorizationError('Forbidden');
  }

  // Use service to fetch student with enrollments
  const student = await studentService.getStudentById(id);

  return apiSuccess(student);
});

// PUT /api/admin/students/[id]
export const PUT = createApiHandler(
  {
    permission: 'students.edit',
    bodySchema: updateStudentSchema,
  },
  async ({ params, body, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    if (!(await canAccessStudent(supabase, { id: user.id, role: user.role }, id))) {
      throw new AuthorizationError('Forbidden');
    }

    // Use service for centralized update logic
    const updatedStudent = await studentService.updateStudent(id, body as any);

    return apiSuccess(updatedStudent, {
      message: 'Thông tin học sinh đã được cập nhật thành công.',
    });
  }
);

// DELETE /api/admin/students/[id]
export const DELETE = createApiHandler(
  { permission: 'students.delete' },
  async ({ params, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    if (!(await canAccessStudent(supabase, { id: user.id, role: user.role }, id))) {
      throw new AuthorizationError('Forbidden');
    }
    // Soft delete via service
    await studentService.deleteStudent(id);

    return apiSuccess(null, {
      message: 'Học sinh đã được chuyển vào kho lưu trữ (tạm khóa).',
    });
  }
);
