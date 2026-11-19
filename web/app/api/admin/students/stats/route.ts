/**
 * Student Statistics API
 * GET /api/admin/students/stats
 *
 * Returns aggregate statistics about students
 */

import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';

type StudentStats = {
  total: number;
  active: number;
  inactive: number;
  by_grade: Record<string, number>;
  by_gender: Record<string, number>;
  enrolled_this_month: number;
};

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request, 'students.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { supabase } = await getDataClient(request);

    const stats: StudentStats = {
      total: 0,
      active: 0,
      inactive: 0,
      by_grade: {},
      by_gender: {},
      enrolled_this_month: 0,
    };

    try {
      // Total students
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');
      stats.total = totalCount || 0;

      // Active students
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true);
      stats.active = activeCount || 0;

      // Inactive students
      const { count: inactiveCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', false);
      stats.inactive = inactiveCount || 0;

      // By grade level
      const { data: gradeData } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('role', 'student')
        .not('grade_level', 'is', null);

      if (gradeData) {
        stats.by_grade = gradeData.reduce<Record<string, number>>((acc, { grade_level }) => {
          acc[grade_level] = (acc[grade_level] || 0) + 1;
          return acc;
        }, {});
      }

      // By gender
      const { data: genderData } = await supabase
        .from('profiles')
        .select('gender')
        .eq('role', 'student')
        .not('gender', 'is', null);

      if (genderData) {
        stats.by_gender = genderData.reduce<Record<string, number>>((acc, { gender }) => {
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {});
      }

      // Enrolled this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: enrolledCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .gte('enrollment_date', startOfMonth.toISOString());
      stats.enrolled_this_month = enrolledCount || 0;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Return partial stats
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/admin/students/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
