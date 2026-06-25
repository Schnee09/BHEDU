import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutor/dashboard
 * Returns tutoring statistics for the authenticated tutor
 */
export const GET = createGetHandler({ allowedRoles: ['tutor'] }, async ({ user }) => {
  const supabase = createServiceClient();

  try {
    const jsDay = new Date().getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // 1. Get unique student count
    const { data: studentSlots, error: studentError } = await supabase
      .from('timetable_slots')
      .select('student_id')
      .eq('teacher_id', user.id)
      .is('deleted_at', null)
      .not('student_id', 'is', null);

    if (studentError) {
      logger.error('Tutor DB error (students):', studentError);
      throw studentError;
    }

    const studentIds = studentSlots?.map((s: any) => s.student_id).filter(Boolean) || [];
    const myStudentCount = new Set(studentIds).size;

    // 2. Get today's sessions count
    const { count: todayCount, error: todayError } = await supabase
      .from('timetable_slots')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id)
      .eq('day_of_week', dayIndex)
      .is('deleted_at', null)
      .not('student_id', 'is', null);

    if (todayError) {
      logger.error('Tutor DB error (today):', todayError);
      throw todayError;
    }

    const todaySessionsCount = todayCount || 0;

    // 3. Get total assigned tutoring sessions count
    const { count: totalCount, error: totalError } = await supabase
      .from('timetable_slots')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id)
      .is('deleted_at', null)
      .not('student_id', 'is', null);

    if (totalError) {
      logger.error('Tutor DB error (total):', totalError);
      throw totalError;
    }

    const totalSessionsCount = totalCount || 0;

    return apiSuccess({
      myStudentCount,
      todaySessionsCount,
      totalSessionsCount,
    });
  } catch (error: any) {
    logger.error('Error in tutor dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
