/**
 * Admin Enrollment ID API
 * GET/PATCH/DELETE /api/admin/enrollments/[id]
 * Standardized to V5.0 Architecture
 */

import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { updateEnrollmentSchema } from '@/lib/schemas';
import { enrollmentService } from '@/lib/services/enrollmentService';
import { NotFoundError } from '@/lib/api/errors';

/**
 * GET /api/admin/enrollments/[id]
 */
export const GET = createGetHandler({ permission: 'enrollments.view' }, async ({ params }) => {
  const id = params.id as string;
  const enrollment = await enrollmentService.getEnrollmentById(id);

  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  return apiSuccess(enrollment);
});

/**
 * PATCH /api/admin/enrollments/[id]
 */
export const PATCH = createApiHandler(
  {
    permission: 'enrollments.manage',
    bodySchema: updateEnrollmentSchema,
  },
  async ({ params, body }) => {
    const id = params.id as string;
    const enrollment = await enrollmentService.updateEnrollment(id, body);

    return apiSuccess(enrollment, {
      message: 'Thông tin ghi danh đã được cập nhật thành công',
    });
  }
);

/**
 * DELETE /api/admin/enrollments/[id]
 */
export const DELETE = createApiHandler({ permission: 'enrollments.manage' }, async ({ params }) => {
  const id = params.id as string;
  // Note: deleteEnrollment in Service delegates to Repository.delete
  // We should ideally check for attendance/grades before deleting,
  // but the repository/service layer should handle that business logic.
  // For now, mirroring the legacy safety check if it's critical,
  // or better yet, move it to enrollmentService.deleteEnrollment.

  await enrollmentService.deleteEnrollment(id);

  return apiSuccess(null, {
    message: 'Ghi danh đã được xóa thành công',
  });
});
