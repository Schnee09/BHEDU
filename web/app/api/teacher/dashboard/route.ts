/**
 * Teacher Dashboard Stats API
 * GET /api/teacher/dashboard - Get teacher's dashboard statistics
 * 
 * Shows teacher-specific stats for their classes
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

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const supabase = createServiceClient()
    const today = new Date().toISOString().split('T')[0]

    // Get teacher's classes
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', authResult.userId)

    const classIds = classes?.map(c => c.id) || []

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          total_classes: 0,
          total_students: 0,
          today_attendance: { marked: 0, present: 0, absent: 0, late: 0 },
          pending_assignments: 0,
          ungraded_assignments: 0,
          recent_activity: []
        }
      })
    }

    // Get total students across all classes
    const { count: totalStudents } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds)

    // Get today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .in('class_id', classIds)
      .eq('date', today)

    const attendanceStats = {
      marked: todayAttendance?.length || 0,
      present: todayAttendance?.filter(a => a.status === 'present').length || 0,
      absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
      late: todayAttendance?.filter(a => a.status === 'late').length || 0
    }

    // Get pending assignments (due in future)
    const { count: pendingAssignments } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds)
      .gte('due_date', today)

    // Get assignments with ungraded students
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        class_id,
        due_date,
        grades:grades(count)
      `)
      .in('class_id', classIds)
      .lte('due_date', today)
      .order('due_date', { ascending: false })
      .limit(20)

    // Count ungraded assignments
    let ungradedCount = 0
    for (const assignment of assignments || []) {
      const { count: enrolledCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', assignment.class_id)

      const gradedCount = assignment.grades?.[0]?.count || 0
      if (gradedCount < (enrolledCount || 0)) {
        ungradedCount++
      }
    }

    // Get recent activity
    const { data: recentGrades } = await supabase
      .from('grades')
      .select(`
        id,
        score,
        graded_at,
        assignment:assignments!inner(title, class_id, max_points),
        student:profiles!grades_student_id_fkey(full_name)
      `)
      .in('assignment.class_id', classIds)
      .order('graded_at', { ascending: false })
      .limit(5)

    const recentActivity = (recentGrades || []).map((g: any) => ({
      type: 'grade',
      description: `Graded ${g.assignment?.title} for ${g.student?.full_name}: ${g.score}/${g.assignment?.max_points}`,
      timestamp: g.graded_at
    }))

    return NextResponse.json({
      success: true,
      stats: {
        total_classes: classes?.length || 0,
        total_students: totalStudents || 0,
        today_attendance: attendanceStats,
        pending_assignments: pendingAssignments || 0,
        ungraded_assignments: ungradedCount,
        classes: classes?.map(c => ({ id: c.id, name: c.name })) || [],
        recent_activity: recentActivity
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
