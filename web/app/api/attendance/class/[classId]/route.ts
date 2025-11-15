/**
 * Get Class Attendance API
 * GET /api/attendance/class/[classId]?date=YYYY-MM-DD
 * 
 * Get attendance records for all students in a class on a specific date
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createServiceClient()
    const { classId } = await params
    const searchParams = req.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Verify teacher has access to this class
    if (authResult.userRole !== 'admin') {
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .eq('teacher_id', authResult.userId)
        .single()

      if (!classData) {
        return NextResponse.json(
          { error: 'You do not have permission to view attendance for this class' },
          { status: 403 }
        )
      }
    }

    // Get class info
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('id, title')
      .eq('id', classId)
      .single()

    if (classError || !classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Use the database function to get class attendance with student details
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .rpc('get_class_attendance', {
        p_class_id: classId,
        p_date: date
      })

    if (attendanceError) {
      logger.error('Failed to fetch class attendance', { error: attendanceError.message })
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const summary = {
      totalStudents: attendanceRecords.length,
      presentCount: attendanceRecords.filter((r: { status: string }) => r.status === 'present').length,
      absentCount: attendanceRecords.filter((r: { status: string }) => r.status === 'absent').length,
      lateCount: attendanceRecords.filter((r: { status: string }) => r.status === 'late').length,
      excusedCount: attendanceRecords.filter((r: { status: string }) => r.status === 'excused').length,
      halfDayCount: attendanceRecords.filter((r: { status: string }) => r.status === 'half_day').length,
      unmarkedCount: attendanceRecords.filter((r: { status: string }) => r.status === 'unmarked').length,
      attendanceRate: 0
    }

    summary.attendanceRate = summary.totalStudents > 0
      ? Math.round(((summary.presentCount + summary.lateCount + summary.halfDayCount) / summary.totalStudents) * 100 * 100) / 100
      : 0

    return NextResponse.json({
      success: true,
      class: classInfo,
      date,
      summary,
      students: attendanceRecords
    })

  } catch (error) {
    logger.error('Get class attendance error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
