/**
 * Audit Logging for Security Monitoring
 * Tracks authentication and authorization events
 */

import { logger } from '@/lib/logger'

export type AuditEventType =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.token.created'
  | 'auth.token.revoked'
  | 'auth.session.expired'
  | 'authz.access.granted'
  | 'authz.access.denied'
  | 'authz.permission.checked'
  | 'admin.action'
  | 'data.read'
  | 'data.write'
  | 'data.delete'
  | 'rate_limit.exceeded'
  | 'rate_limit.blocked'

export interface AuditEvent {
  timestamp: number
  type: AuditEventType
  userId?: string
  userEmail?: string
  userRole?: string
  resource?: string
  action?: string
  success: boolean
  reason?: string
  metadata?: Record<string, any>
  request?: {
    ip?: string
    userAgent?: string
    method?: string
    url?: string
    headers?: Record<string, string>
  }
}

/**
 * In-memory audit log store
 * In production, write to database or external logging service
 */
const auditLogStore: AuditEvent[] = []
const MAX_LOG_SIZE = 10000 // Keep last 10k events in memory

/**
 * Log an audit event
 */
export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  const fullEvent: AuditEvent = {
    timestamp: Date.now(),
    ...event
  }
  
  // Add to in-memory store
  auditLogStore.push(fullEvent)
  
  // Trim if exceeds max size
  if (auditLogStore.length > MAX_LOG_SIZE) {
    auditLogStore.splice(0, auditLogStore.length - MAX_LOG_SIZE)
  }
  
  // Log to application logger
  const logLevel = event.success ? 'info' : 'warn'
  const message = formatAuditMessage(fullEvent)
  
  logger[logLevel](message, {
    auditEvent: fullEvent
  })
  
  // In production, also send to external service
  // await sendToExternalLoggingService(fullEvent)
}

/**
 * Format audit event as readable message
 */
function formatAuditMessage(event: AuditEvent): string {
  const parts: string[] = []
  
  parts.push(`[${event.type}]`)
  
  if (event.userId) {
    parts.push(`User: ${event.userEmail || event.userId}`)
  }
  
  if (event.userRole) {
    parts.push(`Role: ${event.userRole}`)
  }
  
  if (event.resource && event.action) {
    parts.push(`${event.action} ${event.resource}`)
  }
  
  parts.push(event.success ? '✓ Success' : '✗ Failed')
  
  if (event.reason) {
    parts.push(`(${event.reason})`)
  }
  
  if (event.request?.ip) {
    parts.push(`IP: ${event.request.ip}`)
  }
  
  return parts.join(' | ')
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(params: {
  success: boolean
  userId?: string
  userEmail?: string
  userRole?: string
  reason?: string
  request?: Request
}): void {
  logAuditEvent({
    type: params.success ? 'auth.login.success' : 'auth.login.failure',
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    success: params.success,
    reason: params.reason,
    request: params.request ? extractRequestInfo(params.request) : undefined
  })
}

/**
 * Log authorization check
 */
export function logAuthzCheck(params: {
  success: boolean
  userId?: string
  userEmail?: string
  userRole?: string
  resource: string
  action: string
  reason?: string
  request?: Request
}): void {
  logAuditEvent({
    type: params.success ? 'authz.access.granted' : 'authz.access.denied',
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    resource: params.resource,
    action: params.action,
    success: params.success,
    reason: params.reason,
    request: params.request ? extractRequestInfo(params.request) : undefined
  })
}

/**
 * Log admin action
 */
export function logAdminAction(params: {
  userId: string
  userEmail?: string
  action: string
  resource: string
  metadata?: Record<string, any>
  request?: Request
}): void {
  logAuditEvent({
    type: 'admin.action',
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: 'admin',
    resource: params.resource,
    action: params.action,
    success: true,
    metadata: params.metadata,
    request: params.request ? extractRequestInfo(params.request) : undefined
  })
}

/**
 * Log data access
 */
export function logDataAccess(params: {
  type: 'read' | 'write' | 'delete'
  userId?: string
  userEmail?: string
  userRole?: string
  resource: string
  success: boolean
  reason?: string
  metadata?: Record<string, any>
  request?: Request
}): void {
  const eventType = 
    params.type === 'read' ? 'data.read' :
    params.type === 'write' ? 'data.write' :
    'data.delete'
  
  logAuditEvent({
    type: eventType,
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    resource: params.resource,
    action: params.type,
    success: params.success,
    reason: params.reason,
    metadata: params.metadata,
    request: params.request ? extractRequestInfo(params.request) : undefined
  })
}

/**
 * Log rate limit event
 */
export function logRateLimitEvent(params: {
  type: 'exceeded' | 'blocked'
  identifier: string
  attempts: number
  request?: Request
}): void {
  logAuditEvent({
    type: params.type === 'exceeded' ? 'rate_limit.exceeded' : 'rate_limit.blocked',
    success: false,
    reason: `Rate limit ${params.type}: ${params.attempts} attempts`,
    metadata: {
      identifier: params.identifier,
      attempts: params.attempts
    },
    request: params.request ? extractRequestInfo(params.request) : undefined
  })
}

/**
 * Extract request information
 */
function extractRequestInfo(request: Request): AuditEvent['request'] {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || undefined
  
  return {
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
    method: request.method,
    url: request.url,
    headers: {
      'content-type': request.headers.get('content-type') || '',
      'accept': request.headers.get('accept') || ''
    }
  }
}

/**
 * Query audit logs
 */
export function queryAuditLogs(filter?: {
  userId?: string
  type?: AuditEventType | AuditEventType[]
  success?: boolean
  startTime?: number
  endTime?: number
  limit?: number
}): AuditEvent[] {
  let results = [...auditLogStore]
  
  if (filter) {
    if (filter.userId) {
      results = results.filter(e => e.userId === filter.userId)
    }
    
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type]
      results = results.filter(e => types.includes(e.type))
    }
    
    if (filter.success !== undefined) {
      results = results.filter(e => e.success === filter.success)
    }
    
    if (filter.startTime) {
      results = results.filter(e => e.timestamp >= filter.startTime!)
    }
    
    if (filter.endTime) {
      results = results.filter(e => e.timestamp <= filter.endTime!)
    }
    
    if (filter.limit) {
      results = results.slice(-filter.limit)
    }
  }
  
  return results.reverse() // Most recent first
}

/**
 * Get audit statistics
 */
export function getAuditStats(timeWindowMs: number = 60 * 60 * 1000): {
  total: number
  byType: Record<string, number>
  successRate: number
  failedAttempts: number
  uniqueUsers: Set<string>
} {
  const now = Date.now()
  const cutoff = now - timeWindowMs
  
  const recentEvents = auditLogStore.filter(e => e.timestamp >= cutoff)
  
  const byType: Record<string, number> = {}
  const uniqueUsers = new Set<string>()
  let successCount = 0
  let failedCount = 0
  
  for (const event of recentEvents) {
    byType[event.type] = (byType[event.type] || 0) + 1
    
    if (event.userId) {
      uniqueUsers.add(event.userId)
    }
    
    if (event.success) {
      successCount++
    } else {
      failedCount++
    }
  }
  
  return {
    total: recentEvents.length,
    byType,
    successRate: recentEvents.length > 0 ? successCount / recentEvents.length : 0,
    failedAttempts: failedCount,
    uniqueUsers
  }
}

/**
 * Export audit logs (for archival or analysis)
 */
export function exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'csv') {
    const headers = ['Timestamp', 'Type', 'User ID', 'User Email', 'Role', 'Resource', 'Action', 'Success', 'Reason', 'IP']
    const rows = auditLogStore.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.userId || '',
      event.userEmail || '',
      event.userRole || '',
      event.resource || '',
      event.action || '',
      event.success ? 'Yes' : 'No',
      event.reason || '',
      event.request?.ip || ''
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }
  
  return JSON.stringify(auditLogStore, null, 2)
}

/**
 * Clear audit logs (use with caution)
 */
export function clearAuditLogs(): void {
  auditLogStore.splice(0, auditLogStore.length)
}
