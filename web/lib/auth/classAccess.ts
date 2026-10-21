import type { SupabaseClient } from '@supabase/supabase-js';

const GLOBAL_CLASS_ROLES = new Set(['admin', 'owner', 'super_admin']);

export async function canAccessClass(
  supabase: SupabaseClient,
  user: { id?: string; role?: string },
  classId: string
): Promise<boolean> {
  if (user.role && GLOBAL_CLASS_ROLES.has(user.role)) {
    return true;
  }

  if (user.role !== 'teacher' || !user.id) {
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
