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

    let query = supabase
      .from('classes')
      .select('id, name, teacher_id, created_at')
      .order('name', { ascending: true })

    // If not admin, filter by teacher_id
    if (authResult.userRole !== 'admin') {
      query = query.eq('teacher_id', authResult.userId)
    }

    const { data: classes, error } = await query

    if (error) {
      logger.error('Failed to fetch classes', { 
        error: error.message, 
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        userId: authResult.userId 
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch classes', 
          details: error.message,
          code: error.code,
          hint: error.hint 
        },
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
