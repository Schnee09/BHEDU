import { z } from 'zod';
import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

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
    allowedRoles: ['admin'],
    bodySchema: bulkArchiveSchema,
  },
  async ({ body }) => {
    const supabase = createServiceClient();
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
