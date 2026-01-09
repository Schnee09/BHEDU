/**
 * Classes API
 * GET /api/classes - Fetch classes
 * POST /api/classes - Create a new class
 * Updated: 2025-12-25 - Added POST endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth, staffAuth } from '@/lib/auth/adminAuth'
import { hasAdminAccess } from '@/lib/auth/permissions'
import { handleApiError, AuthenticationError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'
import { ClassService } from '@/lib/services/classService'

export async function GET(request: Request) {
  try {
    logger.info('Classes API called');
    
    // Use existing teacherAuth - it returns profile.id as userId
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      logger.warn('Auth failed:', { reason: authResult.reason })
      return NextResponse.json({ success: false, error: authResult.reason }, { status: 401 })
    }

    const supabase = createServiceClient()
    const userRole = authResult.userRole || ''
    const profileId = authResult.userId // This is profile.id from teacherAuth

    logger.info('Auth successful', { userRole, profileId })

    // Admin/staff see all classes
    if (userRole === 'admin' || userRole === 'staff') {
      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id, name, teacher_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('name', { ascending: true })

      if (error) {
        logger.error('DB error:', { error: error.message })
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      logger.info('Classes fetched for admin/staff', { count: classes?.length || 0, userRole })
      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Teachers see only their classes
    if (userRole === 'teacher' && profileId) {
      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id, name, teacher_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('teacher_id', profileId)
        .order('name', { ascending: true })

      if (error) {
        logger.error('DB error:', { error: error.message })
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      logger.info('Classes fetched for teacher', { count: classes?.length || 0, profileId })
      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Students see only classes they're enrolled in
    if (userRole === 'student' && profileId) {
      // First get enrolled class IDs
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profileId)
        .eq('status', 'active')

      if (enrollError) {
        logger.error('Enrollment fetch error:', { error: enrollError.message })
        return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 })
      }

      const classIds = (enrollments || []).map(e => e.class_id)

      if (classIds.length === 0) {
        logger.info('No enrollments found for student', { profileId })
        return NextResponse.json({ success: true, classes: [] })
      }

      // Fetch the enrolled classes
      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id, name, teacher_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .in('id', classIds)
        .order('name', { ascending: true })

      if (error) {
        logger.error('DB error:', { error: error.message })
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      logger.info('Classes fetched for student', { count: classes?.length || 0, profileId })
      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Fallback - no classes (shouldn't reach here)
    logger.warn('Unknown role, returning empty classes', { userRole, profileId })
    return NextResponse.json({ success: true, classes: [] })
  } catch (error) {
    logger.error('Classes API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await staffAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const body = await request.json()
    const { name, code, description, teacherId, academicYearId, grade } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Tên lớp là bắt buộc' },
        { status: 400 }
      )
    }

    const newClass = await ClassService.createClass({
      name,
      teacher_id: teacherId,
      academic_year_id: academicYearId,
      max_capacity: body.maxCapacity || 40,
      sessions_per_week: body.sessionsPerWeek || 5,
      class_type: body.classType || 'group',
    })

    logger.info('Class created:', { classId: newClass.id, name: newClass.name })

    return NextResponse.json({ success: true, class: newClass }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

