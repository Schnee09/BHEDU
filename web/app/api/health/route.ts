import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple health check for uptime monitoring
export async function GET() {
  const start = Date.now()
  
  try {
    // Check Supabase connectivity
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      logger.error('Health check failed: missing Supabase env vars')
      return NextResponse.json({ status: 'unhealthy', reason: 'missing env vars' }, { status: 503 })
    }
    
    const sb = createClient(url, key)
    const { error } = await sb.from('profiles').select('id').limit(1).single()
    
    // Allow no rows (table might be empty) but not connection errors
    if (error && error.code !== 'PGRST116') {
      logger.error('Health check failed: Supabase query error', error)
      return NextResponse.json({ status: 'unhealthy', reason: 'database error', error: error.message }, { status: 503 })
    }
    
    const duration = Date.now() - start
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      service: 'bh-edu-web'
    })
  } catch (err) {
    logger.error('Health check exception', err)
    return NextResponse.json({ status: 'unhealthy', reason: 'exception' }, { status: 503 })
  }
}
