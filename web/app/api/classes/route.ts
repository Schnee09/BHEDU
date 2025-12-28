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

    // Simple query
    let query = supabase
      .from('classes')
      .select('id, name, teacher_id, created_at')
      .order('name', { ascending: true })

    // Filter for teachers and students - admin/staff see all
    if (userRole !== 'admin' && userRole !== 'staff') {
      if (userRole === 'teacher' && profileId) {
        query = query.eq('teacher_id', profileId)
        logger.info('Filtering for teacher', { profileId })
      }
      // Students would need enrollment-based filtering (TODO)
    }

    const { data: classes, error } = await query

    if (error) {
      logger.error('DB error:', { error: error.message })
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    logger.info('Classes fetched', { count: classes?.length || 0, userRole })
    return NextResponse.json({ success: true, classes: classes || [] })
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

