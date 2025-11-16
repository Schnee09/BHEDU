/**
 * My Classes API
 * GET /api/classes/my-classes
 * 
 * Get classes for the current teacher or all classes for admins
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

  const supabase = createClientFromRequest(request as any)

    let query = supabase
      .from('classes')
      .select('id, title, description, created_at')
      .order('title', { ascending: true })

    // If not admin, filter by teacher_id
    if (authResult.userRole !== 'admin') {
      query = query.eq('teacher_id', authResult.userId)
    }

    const { data: classes, error } = await query

    if (error) {
      logger.error('Failed to fetch classes', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      classes: classes || []
    })

  } catch (error) {
    logger.error('Get classes error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
