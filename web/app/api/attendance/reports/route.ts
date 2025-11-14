/**
 * Attendance Reports API
 * GET /api/attendance/reports
 * 
 * Get attendance reports with analytics and filtering
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Build the query
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(
          id,
          email,
          first_name,
          last_name,
          student_id,
          grade_level
        ),
        class:classes!attendance_class_id_fkey(
          id,
          title,
          code
        )
      `)
      .order('date', { ascending: false })

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // If not admin, filter by teacher's classes
    if (authResult.userRole !== 'admin') {
      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', authResult.userId)

      const classIds = teacherClasses?.map(c => c.id) || []
      if (classIds.length > 0) {
        query = query.in('class_id', classIds)
      } else {
        // Teacher has no classes
        return NextResponse.json({
          success: true,
          data: [],
          analytics: {
            totalRecords: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0,
            totalExcused: 0,
            totalHalfDay: 0,
            attendanceRate: 0,
            byStatus: {},
            byClass: {},
            byStudent: {}
          }
        })
      }
    }

    const { data: records, error } = await query

    if (error) {
      logger.error('Failed to fetch attendance reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    // Calculate analytics
    const totalRecords = records?.length || 0
    const totalPresent = records?.filter(r => r.status === 'present').length || 0
    const totalAbsent = records?.filter(r => r.status === 'absent').length || 0
    const totalLate = records?.filter(r => r.status === 'late').length || 0
    const totalExcused = records?.filter(r => r.status === 'excused').length || 0
    const totalHalfDay = records?.filter(r => r.status === 'half_day').length || 0
    
    const attendanceRate = totalRecords > 0
      ? Math.round(((totalPresent + totalLate + totalHalfDay * 0.5) / totalRecords) * 100)
      : 0

    // Group by status
    const byStatus: Record<string, number> = {}
    records?.forEach(record => {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1
    })

    // Group by class
    const byClass: Record<string, { name: string; count: number; present: number; rate: number }> = {}
    records?.forEach(record => {
      const classKey = record.class_id
      if (!byClass[classKey]) {
        byClass[classKey] = {
          name: record.class?.title || 'Unknown',
          count: 0,
          present: 0,
          rate: 0
        }
      }
      byClass[classKey].count++
      if (record.status === 'present' || record.status === 'late' || record.status === 'half_day') {
        byClass[classKey].present += record.status === 'half_day' ? 0.5 : 1
      }
    })

    // Calculate rates for each class
    Object.keys(byClass).forEach(key => {
      byClass[key].rate = byClass[key].count > 0
        ? Math.round((byClass[key].present / byClass[key].count) * 100)
        : 0
    })

    // Group by student
    const byStudent: Record<string, { name: string; studentId: string; count: number; present: number; rate: number }> = {}
    records?.forEach(record => {
      const studentKey = record.student_id
      if (!byStudent[studentKey]) {
        byStudent[studentKey] = {
          name: `${record.student?.first_name || ''} ${record.student?.last_name || ''}`.trim() || 'Unknown',
          studentId: record.student?.student_id || '',
          count: 0,
          present: 0,
          rate: 0
        }
      }
      byStudent[studentKey].count++
      if (record.status === 'present' || record.status === 'late' || record.status === 'half_day') {
        byStudent[studentKey].present += record.status === 'half_day' ? 0.5 : 1
      }
    })

    // Calculate rates for each student
    Object.keys(byStudent).forEach(key => {
      byStudent[key].rate = byStudent[key].count > 0
        ? Math.round((byStudent[key].present / byStudent[key].count) * 100)
        : 0
    })

    return NextResponse.json({
      success: true,
      data: records,
      analytics: {
        totalRecords,
        totalPresent,
        totalAbsent,
        totalLate,
        totalExcused,
        totalHalfDay,
        attendanceRate,
        byStatus,
        byClass,
        byStudent
      }
    })
  } catch (error) {
    logger.error('Attendance reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
