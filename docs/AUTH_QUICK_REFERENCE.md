# Enhanced Auth System - Quick Reference

## 🚀 Quick Start

### Authentication (No Changes Required!)
```typescript
import { adminAuth, teacherAuth } from '@/lib/auth/adminAuth'

// Your existing code continues to work
const authResult = await teacherAuth(request)
if (!authResult.authorized) {
  return NextResponse.json({ error: authResult.reason }, { status: 401 })
}

// Now includes: ✅ Rate limiting ✅ Caching ✅ Audit logging
```

### Check Permissions
```typescript
import { checkPermission } from '@/lib/auth/adminAuth'

if (!checkPermission(authResult.userRole!, 'grades', 'write')) {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
}
```

### Manual Audit Logging
```typescript
import { logAdminAction } from '@/lib/auth/auditLog'

logAdminAction({
  userId: authResult.userId!,
  action: 'delete',
  resource: 'user',
  metadata: { targetUserId: 'xyz' },
  request
})
```

## 📋 API Endpoints

### Monitor Auth System
```
GET /api/admin/monitoring/auth?timeWindow=3600000
```

### Export Audit Logs
```
GET /api/admin/monitoring/audit-logs?format=csv&hours=24
```

### Check Permissions
```
GET /api/admin/monitoring/check-permission?role=teacher
POST /api/admin/monitoring/check-permission (with context)
```

## 🔑 Permission Resources

- `classes` - Class management
- `students` - Student records
- `grades` - Grade entries
- `assignments` - Assignment creation
- `attendance` - Attendance tracking
- `categories` - Assignment categories
- `enrollments` - Class enrollments
- `users` - User management
- `finance` - Financial records
- `reports` - Report generation
- `settings` - System settings
- `import` - Data import
- `*` - All resources (admin only)

## 🎯 Permission Actions

- `read` - View data
- `write` - Create/update data
- `delete` - Remove data
- `manage` - Full control (read + write + delete)

## 🛡️ Rate Limit Configs

```typescript
// Authentication (10/min, 15min block)
rateLimitConfigs.auth

// Strict auth (5/min, 30min block)
rateLimitConfigs.authStrict

// General API (100/min, 5min block)
rateLimitConfigs.api
```

## 💾 Cache Namespaces

```typescript
'auth'       // User profiles (5min TTL)
'session'    // Session data (10min TTL)
'permission' // Permission checks (15min TTL)
```

## 📊 Audit Event Types

### Authentication
- `auth.login.success`
- `auth.login.failure`
- `auth.logout`
- `auth.token.created`
- `auth.session.expired`

### Authorization
- `authz.access.granted`
- `authz.access.denied`
- `authz.permission.checked`

### Data Access
- `data.read`
- `data.write`
- `data.delete`

### Admin Actions
- `admin.action`

### Rate Limiting
- `rate_limit.exceeded`
- `rate_limit.blocked`

## 🔧 Common Patterns

### Clear Cache After Update
```typescript
import { deleteCached } from '@/lib/auth/cache'

// After updating profile
deleteCached(`profile:${userId}`, 'auth')
```

### Query Recent Failures
```typescript
import { queryAuditLogs } from '@/lib/auth/auditLog'

const failures = queryAuditLogs({
  type: 'auth.login.failure',
  startTime: Date.now() - (24 * 60 * 60 * 1000),
  limit: 50
})
```

### Reset Rate Limit (Emergency)
```typescript
import { resetRateLimit } from '@/lib/auth/rateLimit'

resetRateLimit('ip:192.168.1.1')
```

### Check Conditional Permission
```typescript
import { checkPermissionWithConditions } from '@/lib/auth/permissions'

const allowed = checkPermissionWithConditions(
  'teacher',
  'grades',
  'write',
  {
    userId: teacherId,
    userClassIds: teacherClasses,
    resourceClassId: gradeClassId
  }
)
```

## 📈 Monitoring Dashboard Ideas

### Real-Time Security Metrics
- Auth success/failure rate
- Active rate limits
- Recent suspicious activity
- Unique active users

### Audit Analytics
- Most accessed resources
- Permission denial patterns
- Peak activity times
- User activity heatmap

### Performance Metrics
- Cache hit rate
- Average auth time
- Database query reduction
- API response times

## 🎓 Best Practices

1. **Always** clear cache when updating user profiles
2. **Use** `checkPermission()` for additional authorization
3. **Log** important admin actions with `logAdminAction()`
4. **Monitor** `/api/admin/monitoring/auth` regularly
5. **Export** audit logs weekly for compliance
6. **Review** rate limit events for security threats
7. **Test** permissions with the check-permission endpoint

## ⚠️ Production Checklist

- [ ] Configure external Redis for rate limiting
- [ ] Set up database table for audit logs
- [ ] Integrate with logging service (Datadog/Sentry)
- [ ] Set up monitoring alerts
- [ ] Configure backup for audit logs
- [ ] Document security policies
- [ ] Test rate limiting with load testing
- [ ] Review and adjust cache TTLs
- [ ] Set up automated audit log exports

## 🆘 Troubleshooting

### Rate Limited Unexpectedly
```typescript
import { getRateLimitStatus } from '@/lib/auth/rateLimit'

const status = getRateLimitStatus('user:xyz')
console.log(status)
// Reset if needed
resetRateLimit('user:xyz')
```

### Cache Not Working
```typescript
import { getCacheStats } from '@/lib/auth/cache'

const stats = getCacheStats()
console.log(stats)
// Clear if corrupted
clearAllCache()
```

### Missing Audit Logs
```typescript
import { getAuditStats } from '@/lib/auth/auditLog'

const stats = getAuditStats()
console.log(`Total events: ${stats.total}`)
```

## 📚 Full Documentation

See `docs/ENHANCED_AUTH_GUIDE.md` for complete documentation.
