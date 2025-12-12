/**
 * Teacher Attendance API
 * GET /api/teacher/attendance - Get attendance for teacher's classes
 * POST /api/teacher/attendance - Mark attendance for teacher's classes
 * 
 * Teachers can only manage attendance for their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError, ValidationError } from '@/lib/api/errors'
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
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('class_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get teacher's class IDs
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', authResult.userId)

    const classIds = teacherClasses?.map(c => c.id) || []

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        attendance: [],
        message: 'No classes assigned'
      })
    }

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        id,
        class_id,
        student_id,
        date,
        status,
        check_in_time,
        notes,
        class:classes(id, name),
        student:profiles!attendance_student_id_fkey(id, full_name, email, student_code)
      `)
      .in('class_id', classIds)
      .order('date', { ascending: false })

    if (classId && classIds.includes(classId)) {
      query = query.eq('class_id', classId)
    }

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      logger.error('Failed to fetch attendance:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      attendance: data || [],
      total: data?.length || 0
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const supabase = createServiceClient()
    const body = await request.json()

    const { class_id, records } = body

    if (!class_id || !records || !Array.isArray(records)) {
      throw new ValidationError('class_id and records array are required')
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('id', class_id)
      .single()

    if (classError || !classData) {
      throw new ValidationError('Class not found')
    }

    if (classData.teacher_id !== authResult.userId) {
      throw new ForbiddenError('You do not have access to this class')
    }

    // Prepare attendance records
    const attendanceRecords = records.map((record: any) => ({
      class_id,
      student_id: record.student_id,
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.status || 'present',
      check_in_time: record.check_in_time || null,
      notes: record.notes || null,
      marked_by: authResult.userId
    }))

    // Upsert attendance (update if exists for same student/class/date)
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'student_id,class_id,date',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      logger.error('Failed to mark attendance:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Marked attendance for ${attendanceRecords.length} students`,
      data
    })

  } catch (error) {
    return handleApiError(error)
  }
}
