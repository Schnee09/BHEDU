/**
 * Auth Monitoring API
 * GET /api/admin/monitoring/auth
 * 
 * Provides real-time monitoring of authentication system
 */

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/auth/adminAuth'
import { getCacheStats } from '@/lib/auth/cache'
import { getAuditStats, queryAuditLogs } from '@/lib/auth/auditLog'
import { getAllRateLimits } from '@/lib/auth/rateLimit'

export async function GET(request: Request) {
  try {
    const authResult = await adminAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000', 10) // Default: 1 hour

    // Get cache statistics
    const cacheStats = getCacheStats()

    // Get audit statistics
    const auditStats = getAuditStats(timeWindow)

    // Get rate limit information
    const rateLimits = getAllRateLimits()
    const rateLimitStats = {
      total: rateLimits.size,
      blocked: Array.from(rateLimits.values()).filter(e => e.blocked).length,
      active: Array.from(rateLimits.values()).filter(e => !e.blocked).length
    }

    // Get recent failed auth attempts
    const recentFailures = queryAuditLogs({
      type: ['auth.login.failure', 'authz.access.denied'],
      success: false,
      limit: 20
    })

    // Get recent rate limit events
    const recentRateLimits = queryAuditLogs({
      type: ['rate_limit.exceeded', 'rate_limit.blocked'],
      limit: 10
    })

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      timeWindow,
      cache: {
        size: cacheStats.size,
        namespaces: cacheStats.namespaces,
        oldestEntry: cacheStats.oldestEntry,
        newestEntry: cacheStats.newestEntry
      },
      audit: {
        total: auditStats.total,
        byType: auditStats.byType,
        successRate: Math.round(auditStats.successRate * 100) / 100,
        failedAttempts: auditStats.failedAttempts,
        uniqueUsers: auditStats.uniqueUsers.size
      },
      rateLimit: rateLimitStats,
      recentActivity: {
        failures: recentFailures.map(f => ({
          timestamp: f.timestamp,
          type: f.type,
          userEmail: f.userEmail,
          reason: f.reason,
          ip: f.request?.ip
        })),
        rateLimitEvents: recentRateLimits.map(r => ({
          timestamp: r.timestamp,
          type: r.type,
          reason: r.reason,
          ip: r.request?.ip
        }))
      }
    })
  } catch (error) {
    console.error('Auth monitoring error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
