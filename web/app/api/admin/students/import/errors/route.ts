/**
 * Import Errors API
 * GET /api/admin/students/import/errors?import_log_id=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const authResult = await adminAuth(req)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      )
    }

    const importLogId = req.nextUrl.searchParams.get('import_log_id')
    if (!importLogId) {
      return NextResponse.json(
        { error: 'import_log_id is required' },
        { status: 400 }
      )
    }

    const { supabase } = await getDataClient(req)
    const { data, error } = await supabase
      .from('import_errors')
      .select('*')
      .eq('import_log_id', importLogId)
      .order('row_number', { ascending: true })

    if (error) {
      logger.error('Failed to fetch import errors', { error: error.message, importLogId })
      return NextResponse.json(
        { error: error.message || 'Failed to fetch import errors' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err) {
    logger.error('Failed to fetch import errors', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
