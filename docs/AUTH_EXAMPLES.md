# Enhanced Auth System - Real-World Examples

## Example 1: Protected API Route with All Features

```typescript
/**
 * Create Assignment API
 * POST /api/assignments
 */
import { NextResponse } from 'next/server'
import { teacherAuth, checkPermission } from '@/lib/auth/adminAuth'
import { logDataAccess } from '@/lib/auth/auditLog'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // ✅ Automatic: Rate limiting, caching, audit logging
  const authResult = await teacherAuth(request)
  
  if (!authResult.authorized) {
    // Already logged by teacherAuth
    if (authResult.rateLimited) {
      return NextResponse.json(
        { error: authResult.reason },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    return NextResponse.json({ error: authResult.reason }, { status: 401 })
  }

  // ✅ Check granular permission
  if (!checkPermission(authResult.userRole!, 'assignments', 'write')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { class_id, title, total_points, due_date } = body

    // Validate input
    if (!class_id || !title || !total_points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify teacher has access to this class
    if (authResult.userRole !== 'admin') {
      const { data: classData } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', class_id)
        .single()

      if (!classData || classData.teacher_id !== authResult.userId) {
        // ✅ Log access denial
        logDataAccess({
          type: 'write',
          userId: authResult.userId,
          userEmail: authResult.userEmail,
          userRole: authResult.userRole,
          resource: 'assignments',
          success: false,
          reason: 'Not teacher of this class',
          metadata: { classId: class_id },
          request
        })
        
        return NextResponse.json(
          { error: 'You can only create assignments for your classes' },
          { status: 403 }
        )
      }
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        class_id,
        title,
        total_points,
        due_date,
        assigned_date: new Date().toISOString(),
        published: true
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    // ✅ Log successful data access
    logDataAccess({
      type: 'write',
      userId: authResult.userId,
      userEmail: authResult.userEmail,
      userRole: authResult.userRole,
      resource: 'assignments',
      success: true,
      metadata: {
        assignmentId: assignment.id,
        classId: class_id,
        title
      },
      request
    })

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Example 2: Admin Dashboard with Monitoring

```typescript
/**
 * Admin Dashboard Page
 * app/dashboard/admin/security/page.tsx
 */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SecurityStats {
  cache: {
    size: number
    namespaces: Record<string, number>
  }
  audit: {
    total: number
    successRate: number
    failedAttempts: number
    uniqueUsers: number
  }
  rateLimit: {
    total: number
    blocked: number
    active: number
  }
  recentActivity: {
    failures: Array<{
      timestamp: number
      type: string
      userEmail?: string
      reason?: string
      ip?: string
    }>
    rateLimitEvents: Array<{
      timestamp: number
      type: string
      reason?: string
      ip?: string
    }>
  }
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/monitoring/auth?timeWindow=3600000')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch security stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportAuditLogs() {
    const res = await fetch('/api/admin/monitoring/audit-logs?format=csv&hours=24')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
  }

  if (loading) return <div>Loading security dashboard...</div>
  if (!stats) return <div>Failed to load stats</div>

  const successRate = (stats.audit.successRate * 100).toFixed(1)
  const isHealthy = stats.audit.successRate > 0.95 && stats.rateLimit.blocked < 10

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <button
          onClick={exportAuditLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Audit Logs (CSV)
        </button>
      </div>

      {/* System Health Alert */}
      {!isHealthy && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠️ Security Alert: {stats.audit.successRate < 0.95 ? 'Low success rate detected' : ''}
            {stats.rateLimit.blocked >= 10 ? 'High number of blocked IPs' : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Attempts:</span>
                <span className="font-bold">{stats.audit.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className={`font-bold ${parseFloat(successRate) > 95 ? 'text-green-600' : 'text-red-600'}`}>
                  {successRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed Attempts:</span>
                <span className="font-bold text-red-600">{stats.audit.failedAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Users:</span>
                <span className="font-bold">{stats.audit.uniqueUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tracked IPs:</span>
                <span className="font-bold">{stats.rateLimit.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-bold text-green-600">{stats.rateLimit.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Blocked:</span>
                <span className="font-bold text-red-600">{stats.rateLimit.blocked}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cache Size:</span>
                <span className="font-bold">{stats.cache.size}</span>
              </div>
              {Object.entries(stats.cache.namespaces).map(([ns, count]) => (
                <div key={ns} className="flex justify-between text-sm">
                  <span className="text-gray-600">{ns}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Attempts (Last 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">IP</th>
                  <th className="text-left p-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.failures.map((failure, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(failure.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2">{failure.type}</td>
                    <td className="p-2">{failure.userEmail || '-'}</td>
                    <td className="p-2 font-mono text-xs">{failure.ip || '-'}</td>
                    <td className="p-2">{failure.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Events */}
      {stats.recentActivity.rateLimitEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Rate Limit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">IP</th>
                    <th className="text-left p-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.rateLimitEvents.map((event, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(event.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2">
                        <span className={event.type.includes('blocked') ? 'text-red-600' : 'text-yellow-600'}>
                          {event.type}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{event.ip || '-'}</td>
                      <td className="p-2">{event.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## Example 3: Permission Testing Tool

```typescript
/**
 * Permission Tester Component
 * Test permissions without making actual API calls
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ROLES = ['admin', 'teacher', 'student']
const RESOURCES = ['classes', 'students', 'grades', 'assignments', 'attendance', 'users', 'finance']
const ACTIONS = ['read', 'write', 'delete', 'manage']

export default function PermissionTester() {
  const [role, setRole] = useState('teacher')
  const [resource, setResource] = useState('grades')
  const [action, setAction] = useState('write')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function testPermission() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/monitoring/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          resource,
          action,
          context: {
            userId: 'test-user-id',
            userClassIds: ['class-1', 'class-2'],
            resourceClassId: 'class-1'
          }
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch (error) {
      console.error('Failed to test permission:', error)
    } finally {
      setLoading(false)
    }
  }

  async function getRolePermissions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/monitoring/check-permission?role=${role}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch (error) {
      console.error('Failed to get permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Resource</label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {RESOURCES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {ACTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={testPermission}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Permission
            </button>
            <button
              onClick={getRolePermissions}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Get All Permissions for {role}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Example 4: Cache Management

```typescript
/**
 * Cache Management Utility
 * Clear cache after sensitive operations
 */
import { deleteCached, clearNamespace } from '@/lib/auth/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = createServiceClient()
  
  // Update profile in database
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  // ✅ Clear cached profile immediately
  deleteCached(`profile:${userId}`, 'auth')
  
  // If role changed, clear related caches
  if (updates.role) {
    clearNamespace('permission')
  }

  return data
}

export async function bulkUpdateUsers(updates: Array<{ id: string, data: any }>) {
  const supabase = createServiceClient()
  
  // Perform bulk updates
  for (const update of updates) {
    await supabase
      .from('profiles')
      .update(update.data)
      .eq('id', update.id)
    
    // Clear cache for each user
    deleteCached(`profile:${update.id}`, 'auth')
  }
  
  // If many users updated, clear entire namespace
  if (updates.length > 10) {
    clearNamespace('auth')
  }
}
```

## Example 5: Security Alert System

```typescript
/**
 * Security Alert System
 * Monitor for suspicious activity
 */
import { queryAuditLogs, getAuditStats } from '@/lib/auth/auditLog'
import { getAllRateLimits } from '@/lib/auth/rateLimit'

export interface SecurityAlert {
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  message: string
  details: any
  timestamp: number
}

export function checkSecurityAlerts(): SecurityAlert[] {
  const alerts: SecurityAlert[] = []
  const now = Date.now()
  const hourAgo = now - (60 * 60 * 1000)

  // Check authentication success rate
  const stats = getAuditStats(60 * 60 * 1000)
  if (stats.successRate < 0.80) {
    alerts.push({
      severity: 'high',
      type: 'low_auth_success_rate',
      message: `Authentication success rate is ${(stats.successRate * 100).toFixed(1)}% (threshold: 80%)`,
      details: { successRate: stats.successRate, total: stats.total },
      timestamp: now
    })
  }

  // Check for brute force patterns (many failures from same IP)
  const recentFailures = queryAuditLogs({
    type: 'auth.login.failure',
    startTime: hourAgo,
    success: false
  })

  const ipFailures = new Map<string, number>()
  for (const failure of recentFailures) {
    const ip = failure.request?.ip
    if (ip) {
      ipFailures.set(ip, (ipFailures.get(ip) || 0) + 1)
    }
  }

  for (const [ip, count] of ipFailures.entries()) {
    if (count > 20) {
      alerts.push({
        severity: 'critical',
        type: 'brute_force_attempt',
        message: `Possible brute force attack from ${ip} (${count} failed attempts in 1 hour)`,
        details: { ip, attempts: count },
        timestamp: now
      })
    }
  }

  // Check rate limit blocks
  const rateLimits = getAllRateLimits()
  const blockedCount = Array.from(rateLimits.values()).filter(e => e.blocked).length
  
  if (blockedCount > 10) {
    alerts.push({
      severity: 'medium',
      type: 'high_rate_limit_blocks',
      message: `${blockedCount} IPs are currently rate-limited`,
      details: { blockedCount, total: rateLimits.size },
      timestamp: now
    })
  }

  // Check for unusual activity patterns
  const uniqueUsers = stats.uniqueUsers.size
  if (uniqueUsers > 100 && stats.failedAttempts > uniqueUsers * 0.5) {
    alerts.push({
      severity: 'medium',
      type: 'unusual_failure_pattern',
      message: `High failure rate relative to user count`,
      details: { uniqueUsers, failures: stats.failedAttempts },
      timestamp: now
    })
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// Run periodic security checks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const alerts = checkSecurityAlerts()
    if (alerts.length > 0) {
      console.warn('🚨 Security Alerts:', alerts)
      // In production: send to monitoring service, email admins, etc.
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}
```

These examples demonstrate real-world usage of all four enhancement features in production scenarios!
