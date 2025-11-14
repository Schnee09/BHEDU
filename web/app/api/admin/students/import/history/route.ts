/**
 * Import History API
 * GET /api/admin/students/import/history
 * 
 * Retrieves the history of bulk import operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Admin authentication
    const authResult = await adminAuth()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get import logs with user details
    const { data: logs, error: logsError, count } = await supabase
      .from('import_logs')
      .select(`
        *,
        importer:profiles!import_logs_imported_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('import_type', 'students')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      logger.error('Failed to fetch import logs', { error: logsError.message })
      return NextResponse.json(
        { error: 'Failed to fetch import history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    logger.error('Import history error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
