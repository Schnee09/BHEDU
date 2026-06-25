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
    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select(
        `
        student_id,
        day_of_week,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name,
          email,
          student_profiles (student_code)
        )
      `
      )
      .eq('teacher_id', user.id)
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
