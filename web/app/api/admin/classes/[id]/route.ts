/**
 * Admin Single Class API (REFACTORED)
 * CRUD operations for a specific class
 */

import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { updateClassSchema } from '@/lib/schemas';
import { ClassService } from '@/lib/services/classService';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';

// GET /api/admin/classes/[id]
export const GET = createGetHandler({ permission: 'classes.view' }, async ({ params, user }) => {
  const id = params.id as string;
  const classData = await ClassService.getClassById(id);

  const canManageAll = await resolveServerPermission(user.id, user.role, 'classes.manage');
  const isAssignedStaff =
    ['teacher', 'tutor', 'staff'].includes(user.role) && classData.teacher_id === user.id;

  if (!canManageAll && !isAssignedStaff) {
    throw new AuthorizationError('Bạn không có quyền xem lớp học này.');
  }

  return apiSuccess(classData);
});

// PATCH /api/admin/classes/[id]
export const PATCH = createApiHandler(
  {
    permission: 'classes.manage',
    bodySchema: updateClassSchema,
  },
  async ({ params, body }) => {
    const id = params.id as string;
    // Check if class exists
    const existing = await ClassService.getClassById(id);
    if (!existing) {
      throw new NotFoundError('Class not found');
    }

    const updatedClass = await ClassService.updateClass(id, body);
    return apiSuccess(updatedClass);
  }
);

// DELETE /api/admin/classes/[id]
export const DELETE = createGetHandler({ permission: 'classes.manage' }, async ({ params }) => {
  const id = params.id as string;
  await ClassService.deleteClass(id);
  return apiSuccess(null, { message: 'Class deleted successfully' });
});
