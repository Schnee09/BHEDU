import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { teacherAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

/**
 * Lightweight /api/classes handler
 * - If called, delegates to teacher/admin behavior and returns classes JSON
 * - This exists to avoid 404 Non-JSON responses for clients that call /api/classes
 */
export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS and avoid recursion
    const supabase = createServiceClient()

    let query = supabase
      .from('classes')
      .select('id, name, teacher_id, created_at')
      .order('name', { ascending: true })

    if (authResult.userRole !== 'admin') {
      query = query.eq('teacher_id', authResult.userId)
    }

    const { data: classes, error } = await query

    if (error) {
      logger.error('Failed to fetch classes (index):', { error })
      return NextResponse.json({ error: 'Failed to fetch classes', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, classes: classes || [] })
  } catch (err: any) {
    logger.error('GET /api/classes error', { error: err })
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
