/**
 * My Classes API
 * GET /api/classes/my-classes
 * 
 * Get classes for the current teacher or all classes for admins
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      logger.warn('Unauthorized my-classes request', { reason: authResult.reason })
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service client to bypass RLS and avoid recursion
    const supabase = createServiceClient()
    const userRole = authResult.userRole || ''
    const profileId = authResult.userId

    // Admin/staff see all classes
    if (userRole === 'admin' || userRole === 'staff') {
      const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .order('name', { ascending: true })

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message })
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
      }

      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Teachers see their assigned classes
    if (userRole === 'teacher' && profileId) {
      const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .eq('teacher_id', profileId)
        .order('name', { ascending: true })

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message })
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
      }

      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Students see their enrolled classes
    if (userRole === 'student' && profileId) {
      // Get enrolled class IDs
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profileId)
        .eq('status', 'active')

      if (enrollError) {
        logger.error('Failed to fetch enrollments', { error: enrollError.message })
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
      }

      const classIds = (enrollments || []).map(e => e.class_id)

      if (classIds.length === 0) {
        return NextResponse.json({ success: true, classes: [] })
      }

      const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, teacher_id, created_at')
        .in('id', classIds)
        .order('name', { ascending: true })

      if (error) {
        logger.error('Failed to fetch classes', { error: error.message })
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
      }

      return NextResponse.json({ success: true, classes: classes || [] })
    }

    // Fallback - return empty
    return NextResponse.json({ success: true, classes: [] })

  } catch (error) {
    logger.error('Get classes error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
