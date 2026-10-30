import type { SupabaseClient } from '@supabase/supabase-js';

const GLOBAL_CLASS_ROLES = new Set(['admin', 'owner', 'super_admin']);

export async function canAccessClass(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  classId: string | null | undefined
): Promise<boolean> {
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) {
    return true;
  }

  if (!['teacher', 'tutor', 'staff'].includes(user.role || '') || !user.id || !classId) {
    return false;
  }

  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function canAccessStudent(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  studentId: string
): Promise<boolean> {
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) {
    return true;
  }

  if (!user.id) {
    return false;
  }

  if (user.role === 'student') {
    return user.id === studentId;
  }

  if (user.role === 'parent') {
    const { data, error } = await supabase
      .from('parent_student_links')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .maybeSingle();

    return !error && Boolean(data);
  }

  if (!['teacher', 'tutor'].includes(user.role || '')) {
    return false;
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select('class_id, classes!inner(teacher_id)')
    .eq('student_id', studentId)
    .eq('classes.teacher_id', user.id)
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data);
}
