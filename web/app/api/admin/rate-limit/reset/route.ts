/**
 * Admin Rate Limit Reset API
 * POST /api/admin/rate-limit/reset - Clear all or specific rate limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getDataClient } from '@/lib/auth/dataClient'
import { resetRateLimit, clearAllRateLimits, cleanupRateLimits, getRateLimitIdentifier } from '@/lib/auth/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // No rate limit check here to allow reset when blocked
  const { supabase } = await getDataClient(request)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { identifier, all } = body

    if (all) {
      clearAllRateLimits()
      return NextResponse.json({ 
        success: true, 
        message: 'All rate limits cleared' 
      })
    }

    if (identifier) {
      resetRateLimit(identifier)
      return NextResponse.json({ 
        success: true, 
        message: `Rate limit cleared for ${identifier}` 
      })
    }

    // Default: cleanup expired and reset current user
    const cleaned = cleanupRateLimits()
    const currentIdentifier = getRateLimitIdentifier(request)
    resetRateLimit(currentIdentifier)

    return NextResponse.json({ 
      success: true, 
      message: `Rate limit reset for current user. Cleaned ${cleaned} expired entries.`,
      identifier: currentIdentifier
    })
  } catch (error) {
    console.error('Rate limit reset error:', error)
    return NextResponse.json({ 
      error: 'Failed to reset rate limits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
