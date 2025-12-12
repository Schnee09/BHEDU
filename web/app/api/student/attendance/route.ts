/**
 * Student Attendance API
 * GET /api/student/attendance - Get student's own attendance records
 * 
 * Students can only see their own attendance
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

    if (authResult.userRole !== 'student') {
      throw new ForbiddenError('This endpoint is for students only')
    }

    const supabase = createServiceClient()
    const studentId = authResult.userId!
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build query - fetch attendance records with class_id
    let query = supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        check_in_time,
        notes,
        class_id
      `)
      .eq('student_id', studentId)
      .order('date', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: attendance, error } = await query.limit(100)

    if (error) {
      logger.error('Failed to fetch student attendance:', { 
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorCode: error.code,
        errorHint: error.hint,
        studentId,
        classId,
        startDate,
        endDate
      })
      
      // Provide more specific error messages
      let errorMessage = 'Database error';
      if (error.code === '42P01') {
        errorMessage = 'Attendance table not found. Please contact your administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: error.details 
        },
        { status: 500 }
      )
    }

    // Fetch class names for the class_ids in attendance records
    const classIds = [...new Set(attendance?.map(a => a.class_id).filter(Boolean) || [])]
    const classMap: Record<string, { id: string; name: string }> = {}
    
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)
      
      classes?.forEach(cls => {
        classMap[cls.id] = cls
      })
    }

    // Calculate stats
    const stats: Record<string, number> = {
      total: attendance?.length || 0,
      present: attendance?.filter(a => a.status === 'present').length || 0,
      absent: attendance?.filter(a => a.status === 'absent').length || 0,
      late: attendance?.filter(a => a.status === 'late').length || 0,
      excused: attendance?.filter(a => a.status === 'excused').length || 0,
      attendance_rate: 100
    }
    
    stats.attendance_rate = stats.total > 0 
      ? Math.round((stats.present + stats.late + stats.excused) / stats.total * 100) 
      : 100

    // Group by class
    const byClass: Record<string, any> = {}
    for (const record of attendance || []) {
      const classData = classMap[record.class_id]
      if (!classData) continue

      if (!byClass[classData.id]) {
        byClass[classData.id] = {
          class_id: classData.id,
          class_name: classData.name,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        }
      }

      byClass[classData.id].total++
      byClass[classData.id][record.status]++
    }

    // Calculate rates per class
    const classSummary = Object.values(byClass).map((cls: any) => ({
      ...cls,
      attendance_rate: cls.total > 0 
        ? Math.round((cls.present + cls.late + cls.excused) / cls.total * 100) 
        : 100
    }))

    return NextResponse.json({
      success: true,
      summary: {
        ...stats,
        by_class: classSummary
      },
      records: attendance?.map((a: any) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        check_in_time: a.check_in_time,
        notes: a.notes,
        class: {
          id: classMap[a.class_id]?.id || a.class_id,
          name: classMap[a.class_id]?.name || 'Unknown Class'
        }
      })) || []
    })

  } catch (error) {
    return handleApiError(error)
  }
}
