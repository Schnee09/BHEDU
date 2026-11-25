import { z } from 'zod';
import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { AuthorizationError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

const bulkArchiveSchema = z.object({
  studentIds: z
    .array(z.string().uuid('Mã học sinh không hợp lệ'))
    .min(1, 'Cần chọn ít nhất một học sinh')
    .max(500, 'Mỗi lần chỉ được lưu trữ tối đa 500 học sinh'),
});

/**
 * Archives multiple student profiles in a single database update.
 * Destructive student lifecycle actions are restricted to management roles.
 */
export const POST = createApiHandler(
  {
    permission: 'students.delete',
    bodySchema: bulkArchiveSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const canArchiveGlobally = ['super_admin', 'owner', 'admin', 'staff'].includes(user.role);
    if (!canArchiveGlobally) {
      if (['student', 'parent'].includes(user.role)) {
        throw new AuthorizationError('Forbidden');
      }

      const { data: accessibleEnrollments, error: accessError } = await supabase
        .from('enrollments')
        .select('student_id, classes!inner(teacher_id)')
        .in('student_id', body.studentIds)
        .eq('status', 'enrolled')
        .eq('classes.teacher_id', user.id);
      if (accessError) throw new Error(`Failed to verify student scope: ${accessError.message}`);

      const accessibleIds = new Set((accessibleEnrollments || []).map((row) => row.student_id));
      if (body.studentIds.some((id) => !accessibleIds.has(id))) {
        throw new AuthorizationError('One or more students are outside your assigned classes');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'inactive', is_active: false })
      .in('id', body.studentIds)
      .eq('role', 'student')
      .select('id');

    if (error) throw new Error(`Failed to archive students: ${error.message}`);

    const archivedIds = (data || []).map((row) => row.id);
    const archivedIdSet = new Set(archivedIds);

    return apiSuccess({
      archivedCount: archivedIds.length,
      archivedIds,
      failedIds: body.studentIds.filter((id) => !archivedIdSet.has(id)),
    });
  }
);
