/**
 * My Classes API
 * GET /api/classes/my-classes
 *
 * Get classes for the current teacher or all classes for admins
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // Teacher or admin authentication
    const auth = await getAuthContext(request, 'classes.view');
    if (!auth.profile) {
      logger.warn('Unauthorized my-classes request', {
        reason: auth.reason,
      });
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        {
          status: 403,
        }
      );
    }

    // Use service client to bypass RLS and avoid recursion
    const supabase = createServiceClient();
    const userRole = auth.role;
    const profileId = auth.profile.id;

    // Center-wide management roles see all classes.
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'owner') {
      const { data: allClasses, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message });
        return NextResponse.json(
          { error: 'Failed to fetch classes' },
          {
            status: 500,
          }
        );
      }

      // Filter to find classes where this admin is the assigned teacher
      const myClasses = (allClasses || []).filter((c) => c.teacher_id === profileId);

      return NextResponse.json({
        success: true,
        classes: allClasses || [],
        myClasses: myClasses, // Expressly include personal classes
      });
    }

    // Operational and custom roles only see their assigned classes.
    if (!['student', 'parent'].includes(userRole) && profileId) {
      const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .eq('teacher_id', profileId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message });
        return NextResponse.json(
          { error: 'Failed to fetch classes' },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({ success: true, classes: classes || [] });
    }

    // Students see their enrolled classes
    if (userRole === 'student' && profileId) {
      // Get enrolled class IDs
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profileId)
        .eq('status', 'enrolled');

      if (enrollError) {
        logger.error('Failed to fetch enrollments', {
          error: enrollError.message,
        });
        return NextResponse.json(
          { error: 'Failed to fetch enrollments' },
          {
            status: 500,
          }
        );
      }

      const classIds = (enrollments || []).map((e) => e.class_id);

      if (classIds.length === 0) {
        return NextResponse.json({ success: true, classes: [] });
      }

      const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .in('id', classIds)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message });
        return NextResponse.json(
          { error: 'Failed to fetch classes' },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({ success: true, classes: classes || [] });
    }

    // Fallback - return empty
    return NextResponse.json({ success: true, classes: [] });
  } catch (error) {
    logger.error('Get classes error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
