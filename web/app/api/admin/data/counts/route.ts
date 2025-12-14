/**
 * Admin Data Viewer: Table Counts API
 * GET /api/admin/data/counts
 *
 * Returns row counts for all allowed tables in a single request.
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { ALLOWED_TABLES } from '../tables/route'
import { getDataClient } from '@/lib/auth/dataClient'
import { handleApiError } from '@/lib/api/errors'
import { enforceRateLimit } from '@/lib/api/rateLimit'
import { rateLimitConfigs } from '@/lib/auth/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      bucketConfig: rateLimitConfigs.dataViewerBucket,
      keyPrefix: 'admin-data-counts',
    })
    if (limited) return limited.response

    const authResult = await adminAuth(request, rateLimitConfigs.bulk)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized', reason: authResult.reason }, { status: 401 })
    }

    const { supabase } = await getDataClient(request)

    const counts: Record<string, number> = {}
    const errors: Record<string, string> = {}

    // Count in parallel, but the number of allowed tables is limited and the route is rate-limited.
    await Promise.all(
      ALLOWED_TABLES.map(async (table) => {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })

          if (error) {
            // Special-case "table missing" for environments mid-migration.
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              counts[table] = 0
              return
            }
            errors[table] = error.message
            counts[table] = 0
            return
          }

          counts[table] = count ?? 0
        } catch (e) {
          errors[table] = e instanceof Error ? e.message : String(e)
          counts[table] = 0
        }
      })
    )

    return NextResponse.json({ success: true, counts, errors })
  } catch (error) {
    return handleApiError(error)
  }
}
