import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_ACADEMIC_MILESTONES } from '@/lib/utils/academicMasterPlan';

export const POST = createApiHandler(
  {
    requireAuth: true,
    allowedRoles: ['super_admin', 'owner', 'admin', 'staff', 'teacher'],
  },
  async ({ user }) => {
    const supabase = createServiceClient();

    // Delete existing events
    await supabase
      .from('calendar_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert standard milestones
    const insertData = DEFAULT_ACADEMIC_MILESTONES.map((m) => ({
      title: m.title,
      event_type: m.type,
      start_date: m.startDate,
      end_date: m.endDate || null,
      description: m.description,
      color: m.color,
      is_all_day: true,
      created_by: user.id,
    }));

    const { data: events, error } = await supabase
      .from('calendar_events')
      .insert(insertData)
      .select();

    if (error) throw error;

    return apiSuccess({ success: true, count: events?.length || 0, events });
  }
);
