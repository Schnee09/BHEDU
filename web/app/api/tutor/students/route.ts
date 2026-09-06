import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutor/students
 * Returns the list of students assigned to the authenticated tutor,
 * aggregated from timetable_slots.
 */
export const GET = createGetHandler({ allowedRoles: ['tutor'] }, async ({ user }) => {
  const supabase = createServiceClient();

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const teacherId = profile?.id || user.id;

    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select(
        `
        id,
        student_id,
        day_of_week,
        start_time,
        end_time,
        notes,
        subject:subjects (id, name),
        student:profiles!timetable_slots_student_id_fkey (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          student_code
        )
      `
      )
      .or(`teacher_id.eq.${teacherId},teacher_id.eq.${user.id}`)
      .is('deleted_at', null)
      .not('student_id', 'is', null);

    if (error) {
      logger.error('Tutor students DB error:', error);
      throw error;
    }

    return apiSuccess(slots ?? []);
  } catch (error: any) {
    logger.error('Error in GET /api/tutor/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
