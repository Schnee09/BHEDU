/**
 * Teacher Classes API
 * GET /api/teacher/classes - Get teacher's own classes with full details
 * 
 * Teachers can only see and manage their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    // Must be a teacher
    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const supabase = createServiceClient()

    // Get teacher's classes with enrollment counts and recent activity
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        teacher_id,
        created_at,
        enrollments:enrollments(count),
        assignments:assignments(count)
      `)
      .eq('teacher_id', authResult.userId)
      .order('name', { ascending: true })

    if (error) {
      logger.error('Failed to fetch teacher classes:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    // Enrich with additional stats
    const enrichedClasses = await Promise.all(
      (classes || []).map(async (cls: any) => {
        // Get recent attendance for this class
        const { count: todayAttendance } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('date', new Date().toISOString().split('T')[0])

        // Get pending assignments (due in future)
        const { count: pendingAssignments } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .gte('due_date', new Date().toISOString().split('T')[0])

        return {
          id: cls.id,
          name: cls.name,
          created_at: cls.created_at,
          student_count: cls.enrollments?.[0]?.count || 0,
          assignment_count: cls.assignments?.[0]?.count || 0,
          today_attendance_marked: todayAttendance || 0,
          pending_assignments: pendingAssignments || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      classes: enrichedClasses,
      total: enrichedClasses.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}
