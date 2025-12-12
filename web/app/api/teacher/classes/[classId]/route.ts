/**
 * Teacher Individual Class API
 * GET /api/teacher/classes/[classId] - Get class details with students
 * PATCH /api/teacher/classes/[classId] - Update class (limited fields)
 * 
 * Teachers can only access their own classes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { handleApiError, AuthenticationError, ForbiddenError, NotFoundError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

async function verifyClassOwnership(supabase: any, classId: string, teacherId: string) {
  const { data: classData, error } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()

  if (error || !classData) {
    throw new NotFoundError('Class not found')
  }

  if (classData.teacher_id !== teacherId) {
    throw new ForbiddenError('You do not have access to this class')
  }

  return classData
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { classId } = await params
    const supabase = createServiceClient()

    // Verify ownership
    const classData = await verifyClassOwnership(supabase, classId, authResult.userId!)

    // Get enrolled students with their details
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        student:profiles!enrollments_student_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('class_id', classId)

    if (enrollError) {
      logger.error('Failed to fetch enrollments:', { error: enrollError })
    }

    // Get assignments for this class
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('id, title, due_date, max_points')
      .eq('class_id', classId)
      .order('due_date', { ascending: false })
      .limit(10)

    // Get recent attendance summary
    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select('id, date, status')
      .eq('class_id', classId)
      .order('date', { ascending: false })
      .limit(50)

    // Calculate attendance stats
    const attendanceStats = {
      total: recentAttendance?.length || 0,
      present: recentAttendance?.filter((a: any) => a.status === 'present').length || 0,
      absent: recentAttendance?.filter((a: any) => a.status === 'absent').length || 0,
      late: recentAttendance?.filter((a: any) => a.status === 'late').length || 0
    }

    return NextResponse.json({
      success: true,
      class: {
        ...classData,
        students: enrollments?.map((e: any) => ({
          ...e.student,
          enrolled_at: e.enrolled_at
        })) || [],
        recent_assignments: assignments || [],
        attendance_stats: attendanceStats
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    if (authResult.userRole !== 'teacher') {
      throw new ForbiddenError('This endpoint is for teachers only')
    }

    const { classId } = await params
    const supabase = createServiceClient()

    // Verify ownership
    await verifyClassOwnership(supabase, classId, authResult.userId!)

    const body = await request.json()
    
    // Teachers can only update limited fields (not teacher_id, not delete)
    const allowedFields = ['name']
    const updates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes' })
    }

    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', classId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update class:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      class: data
    })

  } catch (error) {
    return handleApiError(error)
  }
}
