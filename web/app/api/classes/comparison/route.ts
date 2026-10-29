import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { AuthorizationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';

// Prevent cross-teacher data leakage from ISR cache
export const dynamic = 'force-dynamic';

const GLOBAL_ANALYTICS_ROLES = new Set(['super_admin', 'owner', 'admin']);
const ASSIGNED_CLASS_ROLES = new Set(['teacher', 'tutor', 'staff']);

export const GET = createGetHandler({ permission: 'grades.view' }, async ({ user }) => {
  const supabase = createServiceClient();

  if (!GLOBAL_ANALYTICS_ROLES.has(user.role) && !ASSIGNED_CLASS_ROLES.has(user.role)) {
    throw new AuthorizationError('Bạn không có quyền xem thống kê lớp này');
  }

  // Assigned teaching roles only see their own classes; management roles see all.
  const { data: classes, error } = await supabase.rpc('get_class_averages', {
    p_teacher_id: GLOBAL_ANALYTICS_ROLES.has(user.role) ? null : user.id,
  });

  if (error) {
    console.error('Error fetching class averages:', error);
    return serverError('Failed to fetch class comparison metrics');
  }

  const formattedClasses = (classes || []).map((cls: any) => ({
    classId: cls.class_id,
    className: cls.class_name,
    teacherName: cls.teacher_name,
    studentCount: parseInt(cls.student_count) || 0,
    averageGPA: parseFloat(cls.average_gpa) || 0,
    attendanceRate: parseFloat(cls.attendance_rate) || 0,
    passRate: parseFloat(cls.pass_rate) || 0,
  }));

  return apiSuccess({ classes: formattedClasses });
});
