/**
 * Get Class Students API
 * GET /api/classes/[classId]/students
 * 
 * Get all students enrolled in a specific class
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
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

    const supabase = createClientFromRequest(req as any)
    const { classId } = await params

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
          { error: 'You do not have permission to view students in this class' },
          { status: 403 }
        )
      }
    }

    // Get students enrolled in this class
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        student:profiles!enrollments_student_id_fkey (
          id,
          email,
          full_name,
          status
        )
      `)
      .eq('class_id', classId)

    if (error) {
      logger.error('Failed to fetch class students', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    // Extract student data from enrollments
    const students = enrollments
      .map((e: { student: unknown }) => e.student)
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      students
    })

  } catch (error) {
    logger.error('Get class students error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
