/**
 * Classes API
 * GET /api/classes - Fetch classes
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { hasAdminAccess } from '@/lib/auth/permissions'
import { handleApiError, AuthenticationError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized')
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('classes')
      .select('id, name, teacher_id, created_at')
      .order('name', { ascending: true })

    // Admin and Staff can see all classes, teachers only their own
    if (!hasAdminAccess(authResult.userRole || '')) {
      query = query.eq('teacher_id', authResult.userId)
    }

    const { data: classes, error } = await query

    if (error) {
      logger.error('Failed to fetch classes:', { error })
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({ success: true, classes: classes || [] })
  } catch (error) {
    return handleApiError(error)
  }
}
