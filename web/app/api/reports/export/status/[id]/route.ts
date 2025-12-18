import { NextResponse } from 'next/server'
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from '@/lib/auth/adminAuth'
import { rateLimitConfigs } from '@/lib/auth/rateLimit'
import { enforceRateLimit } from '@/lib/api/rateLimit'
import { handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = enforceRateLimit(request, { bucketConfig: rateLimitConfigs.apiBucket, keyPrefix: 'reports-export-status' })
    if (limited) return limited.response

    const authResult = await adminAuth(request, rateLimitConfigs.auth)
    if (!authResult.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { supabase } = await getDataClient(request)
    const { id } = await params
    const { data, error } = await (supabase as any).from('report_exports').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Return status and result_url/error_message when available
    const resp = {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      started_at: data.started_at,
      finished_at: data.finished_at,
      downloadUrl: data.result_url || null,
      error: data.error_message || null,
    }

    return NextResponse.json({ success: true, job: resp })
  } catch (error) {
    return handleApiError(error)
  }
}
