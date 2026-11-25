import type { SupabaseClient } from '@supabase/supabase-js';

const GLOBAL_CLASS_ROLES = new Set(['admin', 'owner', 'super_admin']);
const GLOBAL_STUDENT_ROLES = new Set(['admin', 'owner', 'super_admin', 'staff']);

export async function canAccessClass(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  classId: string | null | undefined
): Promise<boolean> {
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) {
    return true;
  }

  if (!user.id || !classId || !user.role || ['student', 'parent'].includes(user.role)) {
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
  if (user.role && GLOBAL_STUDENT_ROLES.has(user.role)) {
    return true;
  }

  if (!user.id || !user.role) {
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

  const { data, error } = await supabase
    .from('enrollments')
    .select('class_id, classes!inner(teacher_id)')
    .eq('student_id', studentId)
    .eq('status', 'enrolled')
    .eq('classes.teacher_id', user.id)
    .limit(1)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function canAccessTimetableSlot(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  slotId: string | null | undefined
): Promise<boolean> {
  if (!user.id || !slotId) return false;

  const { data: slot, error } = await supabase
    .from('timetable_slots')
    .select('class_id, student_id, teacher_id')
    .eq('id', slotId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !slot) return false;
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) return true;
  if (slot.teacher_id === user.id) return true;

  if (slot.class_id) {
    return canAccessClass(supabase, user, slot.class_id);
  }

  if (slot.student_id) {
    return canAccessStudent(supabase, user, slot.student_id);
  }

  return false;
}

export async function canAccessTimetableTarget(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  target: {
    classId?: string | null;
    studentId?: string | null;
    teacherId?: string | null;
  }
): Promise<boolean> {
  if (!user.id) return false;
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) return true;
  if (target.teacherId === user.id) return true;
  if (target.classId && (await canAccessClass(supabase, user, target.classId))) return true;
  if (target.studentId && (await canAccessStudent(supabase, user, target.studentId))) return true;
  return false;
}
