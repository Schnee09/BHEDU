import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { AuthorizationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';

// Disable static caching for authenticated route
export const dynamic = 'force-dynamic';

const GLOBAL_ATTENDANCE_ROLES = new Set(['super_admin', 'owner', 'admin']);
const ASSIGNED_CLASS_ROLES = new Set(['teacher', 'tutor', 'staff']);

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const GET = createGetHandler({ requireAuth: true }, async ({ user }) => {
  const supabase = createServiceClient();

  // If student, fetch personal weekly attendance
  if (user.role === 'student') {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() || 7) + 1);
    monday.setHours(0, 0, 0, 0);

    const { data: records, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', user.id)
      .gte('date', formatLocalDate(monday));

    if (error) {
      console.error('Error fetching student weekly attendance:', error);
      return serverError('Failed to fetch personal attendance');
    }

    // Map to 6 days (T2-T7) like the global RPC
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weeklyData = days.map((name, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(date);
      const record = (records || []).find((r) => r.date === dateStr);

      return {
        name,
        present: record ? (['present', 'late'].includes(record.status) ? 100 : 0) : 0,
        status: record ? record.status : 'missing',
      };
    });

    return apiSuccess({ weeklyData });
  }

  if (!GLOBAL_ATTENDANCE_ROLES.has(user.role) && !ASSIGNED_CLASS_ROLES.has(user.role)) {
    throw new AuthorizationError('Bạn không có quyền xem thống kê chuyên cần này');
  }

  const { data, error } = await supabase.rpc('get_weekly_attendance', {
    p_teacher_id: GLOBAL_ATTENDANCE_ROLES.has(user.role) ? null : user.id,
  });

  if (error) {
    console.error('Error fetching weekly attendance:', error);
    return serverError('Failed to fetch weekly attendance');
  }

  const weeklyData = (data || []).map((item: any) => ({
    name: item.day_name,
    present: parseFloat(item.attendance_rate) || 0,
  }));

  return apiSuccess({ weeklyData });
});
