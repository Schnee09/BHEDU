# Enhanced Authentication System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API REQUEST FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                                 ┌──────────────┐
                                 │   Client     │
                                 │   Request    │
                                 └──────┬───────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │  API Route Handler       │
                         │  (e.g., POST /api/grades)│
                         └──────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────┐
                    │   adminAuth() or teacherAuth()    │
                    └───────────────┬───────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌────────────────┐        ┌──────────────────┐
│ RATE LIMITER  │          │  CACHE LAYER   │        │  AUDIT LOGGER    │
│               │          │                │        │                  │
│ • Check IP    │          │ • Check cache  │        │ • Log attempt    │
│ • Count reqs  │          │ • Profile hit? │        │ • Record IP      │
│ • Block if >  │          │ • Return if    │        │ • Track user     │
│   threshold   │          │   cached       │        │ • Store metadata │
└───────┬───────┘          └────────┬───────┘        └──────────────────┘
        │                           │
        │ If blocked                │ Cache miss
        │                           │
        ▼                           ▼
┌─────────────────────┐   ┌──────────────────────────┐
│  Return 429         │   │   Supabase Query         │
│  Rate Limited       │   │   • auth.getUser()       │
└─────────────────────┘   │   • profiles query       │
                          └──────────┬───────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────┐
                          │  Update Cache            │
                          │  • Store profile         │
                          │  • Set TTL (5min)        │
                          └──────────┬───────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────┐
                          │  Permission Check        │
                          │  • Verify role           │
                          │  • Check conditions      │
                          └──────────┬───────────────┘
                                     │
                ┌────────────────────┴────────────────────┐
                │                                         │
                ▼                                         ▼
    ┌──────────────────────┐              ┌──────────────────────────┐
    │  AUTHORIZED          │              │  UNAUTHORIZED            │
    │  • Return AuthResult │              │  • Log failure           │
    │  • userId            │              │  • Return reason         │
    │  • userRole          │              │  • Increment rate limit  │
    └──────────┬───────────┘              └──────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Business Logic      │
    │  • checkPermission() │
    │  • Process request   │
    │  • logDataAccess()   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Response            │
    │  200 OK / 403        │
    └──────────────────────┘
```

## Component Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM COMPONENTS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   adminAuth.ts       │  ◄──────┐
│   teacherAuth.ts     │         │
│                      │         │ Uses
│ • Main entry points  │         │
│ • Orchestrates all   │         │
│ • Returns AuthResult │         │
└──────────┬───────────┘         │
           │                     │
           │ Uses                │
           │                     │
           ▼                     │
┌──────────────────────────────────────────────────────────────┐
│                    SUPPORTING MODULES                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  rateLimit.ts    │   │   cache.ts       │   │  auditLog.ts     │
│                  │   │                  │   │                  │
│ • checkRateLimit │   │ • getCached      │   │ • logAuthAttempt │
│ • resetRateLimit │   │ • setCached      │   │ • queryAuditLogs │
│ • cleanup        │   │ • deleteCached   │   │ • getAuditStats  │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐
│  permissions.ts  │   │   index.ts       │
│                  │   │                  │
│ • hasPermission  │   │ • Exports all    │
│ • checkConditions│   │ • Clean imports  │
│ • getRolePerms   │   │                  │
└──────────────────┘   └──────────────────┘
```

## Data Flow Example

```
Example: Teacher creating a grade entry

1. POST /api/grades { student_id, assignment_id, points: 95 }
   │
   ├─► teacherAuth(request)
   │   │
   │   ├─► Rate Limiter
   │   │   └─► ✓ Allowed (2/10 attempts)
   │   │
   │   ├─► Cache Check
   │   │   └─► ✗ Miss (first request today)
   │   │
   │   ├─► Supabase Query
   │   │   └─► Profile found: { role: 'teacher', id: 'T123' }
   │   │
   │   ├─► Update Cache
   │   │   └─► Cached for 5 minutes
   │   │
   │   └─► Audit Log
   │       └─► auth.login.success (Teacher T123)
   │
   ├─► AuthResult { authorized: true, userId: 'T123', role: 'teacher' }
   │
   ├─► checkPermission('teacher', 'grades', 'write')
   │   └─► ✓ Teachers can write grades
   │
   ├─► Verify assignment is in teacher's class
   │   └─► ✓ Assignment belongs to Class C1 (taught by T123)
   │
   ├─► Insert grade record
   │   └─► Grade G456 created
   │
   ├─► logDataAccess({ type: 'write', resource: 'grades' })
   │   └─► data.write logged with metadata
   │
   └─► Response 201 Created { id: 'G456', points: 95 }
```

## Monitoring Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING ENDPOINTS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/admin/monitoring/auth
   │
   ├─► adminAuth(request)  [Verify admin access]
   │
   ├─► getCacheStats()
   │   └─► { size: 145, namespaces: { auth: 120, session: 25 } }
   │
   ├─► getAuditStats(1 hour)
   │   └─► { total: 523, successRate: 0.96, failedAttempts: 21 }
   │
   ├─► getAllRateLimits()
   │   └─► { total: 34, blocked: 2, active: 32 }
   │
   └─► queryAuditLogs({ type: 'failure', limit: 20 })
       └─► [Recent failures with IP, reason, timestamp]

GET /api/admin/monitoring/audit-logs?format=csv&hours=24
   │
   ├─► adminAuth(request)
   │
   ├─► queryAuditLogs({ startTime: 24h ago })
   │   └─► 1,234 events found
   │
   └─► exportAuditLogs('csv')
       └─► Download audit-logs-1234567890.csv

POST /api/admin/monitoring/check-permission
Body: { role: 'teacher', resource: 'grades', action: 'write', context: {...} }
   │
   ├─► adminAuth(request)
   │
   ├─► hasPermission('teacher', 'grades', 'write')
   │   └─► ✓ true
   │
   ├─► checkPermissionWithConditions(...)
   │   └─► ✓ true (class condition met)
   │
   └─► Response { hasBasicPermission: true, hasFullPermission: true }
```

## Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IN-MEMORY STORES                                    │
│                     (Production: Use Redis/DB)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐
│  Rate Limit Store          │
│  Map<string, RateLimitEntry>│
│                            │
│  'ip:192.168.1.1'         │
│    count: 5               │
│    resetTime: 1701518400  │
│    blocked: false         │
│                            │
│  'user:UUID'              │
│    count: 11              │
│    resetTime: 1701518460  │
│    blocked: true          │
│    blockUntil: 1701519360 │
│                            │
│  Cleanup: Every 5 minutes  │
└────────────────────────────┘

┌────────────────────────────┐
│  Cache Store               │
│  Map<string, CacheEntry>   │
│                            │
│  'auth:profile:UUID'      │
│    data: { id, role }     │
│    timestamp: 1701518300  │
│    expiresAt: 1701518600  │
│                            │
│  'session:token:XYZ'      │
│    data: { userId }       │
│    timestamp: 1701518200  │
│    expiresAt: 1701518800  │
│                            │
│  Cleanup: Every 2 minutes  │
│  Max Size: 1000-5000       │
└────────────────────────────┘

┌────────────────────────────┐
│  Audit Log Store           │
│  Array<AuditEvent>         │
│                            │
│  [                         │
│    {                       │
│      timestamp: 170151830  │
│      type: 'auth.success'  │
│      userId: 'UUID'        │
│      userRole: 'teacher'   │
│      request: { ip: ... }  │
│    },                      │
│    ...                     │
│  ]                         │
│                            │
│  Max Size: 10,000 events   │
│  Auto-trim: FIFO           │
└────────────────────────────┘
```

## Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROLE PERMISSION MATRIX                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Resource        │  Admin  │  Teacher   │  Student
─────────────────┼─────────┼────────────┼──────────────────
classes         │  RWDM   │  R, W*     │  R* (enrolled)
students        │  RWDM   │  R, W*     │  - (none)
grades          │  RWDM   │  RWD*      │  R* (own only)
assignments     │  RWDM   │  RWD*      │  R* (enrolled)
attendance      │  RWDM   │  RWD*      │  R* (own only)
categories      │  RWDM   │  RWD*      │  - (none)
enrollments     │  RWDM   │  RW*       │  - (none)
users           │  RWDM   │  - (none)  │  - (none)
finance         │  RWDM   │  - (none)  │  - (none)
reports         │  RWDM   │  R*        │  R* (own only)
settings        │  RWDM   │  - (none)  │  - (none)
import          │  RWDM   │  - (none)  │  - (none)

Legend:
  R = Read
  W = Write (Create/Update)
  D = Delete
  M = Manage (Full control)
  * = Conditional (class-scoped or own-only)
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXPECTED PERFORMANCE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Authentication Time (with caching):
┌────────────────────────────────────────────────┐
│ Cache Hit  ████░░░░░░   ~5ms   (90% of requests)
│ Cache Miss ████████░░   ~25ms  (10% of requests)
│ With Rate  ████░░░░░░   ~6ms   (always active)
└────────────────────────────────────────────────┘

Database Query Reduction:
┌────────────────────────────────────────────────┐
│ Before Caching: 100 queries/min
│ After Caching:   10 queries/min
│ Reduction:      90% ████████████████████
└────────────────────────────────────────────────┘

Memory Usage:
┌────────────────────────────────────────────────┐
│ Rate Limits:   ~100 KB  (1000 entries)
│ Cache:         ~500 KB  (5000 entries)
│ Audit Logs:    ~2 MB    (10k events)
│ Total:         ~2.6 MB
└────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SECURITY DEFENSE LAYERS                               │
└─────────────────────────────────────────────────────────────────────────────┘

Request Flow Through Security Layers:

1. Rate Limiting Layer
   ↓
   • Blocks brute-force attacks
   • IP-based throttling
   • Progressive blocking
   ↓

2. Authentication Layer
   ↓
   • Verify Supabase session
   • Bearer token fallback
   • Profile validation
   ↓

3. Authorization Layer (Role)
   ↓
   • Admin / Teacher / Student
   • Basic role check
   ↓

4. Permission Layer (Granular)
   ↓
   • Resource-specific permissions
   • Action-based access control
   • Conditional restrictions
   ↓

5. Audit Layer
   ↓
   • Log all access attempts
   • Track security events
   • Compliance recording
   ↓

6. Business Logic
   ↓
   • Validate data ownership
   • Check relationships
   • Process request
```

---

This architecture provides:
- ✅ **Multi-layer security** (rate limit → auth → authz → permissions)
- ✅ **Performance optimization** (caching reduces DB load by 90%)
- ✅ **Complete audit trail** (every event logged)
- ✅ **Real-time monitoring** (dashboard endpoints)
- ✅ **Scalability ready** (Redis/DB migration path)
