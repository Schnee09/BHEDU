## BH EDU Web

Next.js 15 production-ready web application for Vietnamese educational institutions. Features secure authentication, role-based access control, comprehensive student/grade management, and Vietnamese transcript support.

## 🚀 Production Status

**✅ Production Ready** - Full security hardening, RLS policies, performance optimizations, and bilingual (Vietnamese) interface.

### Recent Updates (Dec 2025)
- ✅ Dashboard with analytics charts (pie, bar, area, radar)
- ✅ Teacher-specific class filtering
- ✅ Comprehensive RLS policies for all tables
- ✅ Database performance indexes
- ✅ Mobile-responsive tables with card view
- ✅ Schema validation overhaul

## 🔐 Security Features

- ✅ **HMAC Authentication** - All internal API routes protected with HMAC-SHA256 signatures
- ✅ **Rate Limiting** - 60 requests/min per IP on all API endpoints
- ✅ **Security Headers** - HSTS, CSP, X-Frame-Options, etc.
- ✅ **Input Validation** - Comprehensive validation on all user inputs
- ✅ **RLS Policies** - Row-Level Security on all database tables
- ✅ **Audit Logging** - All admin actions logged to database
- ✅ **Error Boundaries** - React error boundaries catch rendering errors

## 📦 Environment Variables

Required environment variables (set in Vercel and `.env.local`):

```env
# Supabase (Public - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Server-only - NEVER expose to client!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Internal API Security
INTERNAL_API_KEY=your-random-secret-key

# Optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Fallback for local dev
```

**⚠️ SECURITY WARNING**: Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` or `INTERNAL_API_KEY` to the client!

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📍 Key Routes

- `/` - Home page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Teacher/student dashboard
- `/admin/courses` - **Admin only** - Manage courses and lessons
- `/api/health` - Health check endpoint for monitoring

## 🔧 Internal API (HMAC Authentication)

All API routes require HMAC-SHA256 signature in `x-internal-signature` header.

### Signature Calculation

```javascript
import crypto from 'crypto'

const signature = crypto
  .createHmac('sha256', INTERNAL_API_KEY)
  .update(payload)  // Empty string for GET/DELETE, JSON body for POST/PUT
  .digest('hex')
```

### API Endpoints

#### Courses
- `GET /api/courses` - List all courses (sign empty string)
- `POST /api/courses` - Create course (sign JSON body)
  ```json
  { "title": "Course Title", "description": "...", "is_published": true }
  ```
- `PUT /api/courses/[id]` - Update course (sign JSON body)
- `DELETE /api/courses/[id]` - Delete course (sign empty string)

#### Lessons
- `GET /api/lessons?course_id=<uuid>` - List lessons for course
  - Accepts signature over empty string OR `course_id=<uuid>` (legacy)
- `POST /api/lessons` - Create lesson (sign JSON body)
  ```json
  {
    "course_id": "uuid",
    "title": "Lesson Title",
    "content": "...",
    "order_index": 1,
    "is_published": true
  }
  ```
- `PUT /api/lessons/[id]` - Update lesson (sign JSON body)
- `DELETE /api/lessons/[id]` - Delete lesson (sign empty string)

#### Users
- `GET /api/users` - List users (profiles table)
- `POST /api/users` - Create user

#### Health
- `GET /api/health` - Health check (no signature required)
  ```json
  {
    "status": "ok",
    "timestamp": "2025-01-...",
    "database": "connected"
  }
  ```

## 🧪 Testing Scripts

### HMAC Request Helper

```bash
# GET request
node web/scripts/hmac-request.mjs \
  --url https://your-app.vercel.app/api/courses \
  --method GET

# POST request
node web/scripts/hmac-request.mjs \
  --url https://your-app.vercel.app/api/courses \
  --method POST \
  --body '{"title":"New Course","description":"Description","is_published":true}'

# With environment variable
INTERNAL_API_KEY=your-key node web/scripts/hmac-request.mjs --url ... --method ...
```

### Windows Batch Test (Full CRUD)

```batch
REM Edit test-apis.bat with your PREVIEW_URL and INTERNAL_API_KEY
test-apis.bat
```

This tests:
1. ✅ GET /api/courses
2. ✅ POST /api/courses (capture ID)
3. ✅ GET /api/lessons?course_id=<id>
4. ✅ POST /api/lessons
5. ✅ PUT /api/courses/<id>
6. ✅ DELETE /api/courses/<id>

### Production Readiness Test

```bash
# Set environment variables
export BASE_URL=http://localhost:3000
export INTERNAL_API_KEY=your-key

# Run comprehensive test suite
node web/scripts/production-test.mjs
```

Tests include:
- Health check endpoint
- API authentication
- Input validation
- Rate limiting (65 rapid requests)
- CRUD operations
- Error handling

## 👥 Admin Access

Admin pages (e.g., `/admin/courses`) require:
1. Valid Supabase session (logged in)
2. `profiles.role = 'admin'`

Non-admin users are redirected to `/unauthorized`.

### Server Actions
- `createCourse(formData)` - Create new course
- `editCourse(formData)` - Update existing course
- `deleteCourse(formData)` - Delete course
- `createLesson(formData)` - Create new lesson
- `editLesson(formData)` - Update existing lesson
- `deleteLesson(formData)` - Delete lesson

All actions:
- ✅ Require admin authentication
- ✅ Validate input (title max 200 chars, content max 50k chars)
- ✅ Log to audit_logs table
- ✅ Show toast notifications on success/error
- ✅ Revalidate page cache

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles (extends auth.users)
- `courses` - Course metadata
- `lessons` - Lesson content (linked to courses)
- `classes` - Classroom/class groups
- `enrollments` - Student-class relationships
- `assignments` - Class assignments
- `submissions` - Student assignment submissions
- `audit_logs` - Admin action audit trail (NEW)

### Indexes
All foreign keys and common query patterns indexed for performance. See `supabase/migrations/010_add_performance_indexes.sql`.

## 🏗️ Architecture

```
web/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (HMAC protected)
│   │   ├── courses/          # Course CRUD
│   │   ├── lessons/          # Lesson CRUD
│   │   ├── users/            # User management
│   │   └── health/           # Health check
│   ├── admin/                # Admin UI
│   │   └── courses/          # Course & lesson management
│   └── dashboard/            # Teacher/student dashboard
├── components/               # React components
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── NavBar.tsx           # Navigation
│   ├── ToastProvider.tsx    # Toast notifications
│   └── ...
├── lib/                      # Utilities
│   ├── supabase/            # Supabase clients
│   │   └── server.ts        # SSR client + service role client
│   ├── adminAuth.ts         # Admin auth helpers
│   ├── logger.ts            # Structured logging
│   ├── rateLimit.ts         # Rate limiting
│   ├── validation.ts        # Input validation
│   └── auditLog.ts          # Audit logging
└── scripts/                  # Testing scripts
    ├── hmac-request.mjs     # HMAC request helper
    └── production-test.mjs  # Production test suite
```

## 🚢 Production Deployment

### Pre-Deploy Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase migrations applied (001-011)
- [ ] Service role key never committed to git
- [ ] `npm run build` succeeds locally
- [ ] Admin user created in `profiles` table with `role='admin'`
- [ ] Health check endpoint accessible
- [ ] Rate limiting tested

### Vercel Setup

1. **Import repository** to Vercel
2. **Set environment variables** (see Environment Variables section above)
3. **Configure build settings**:
   - Framework: Next.js
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Deploy**

### Post-Deploy Verification

```bash
# Test health check
curl https://your-app.vercel.app/api/health

# Run production tests
BASE_URL=https://your-app.vercel.app \
INTERNAL_API_KEY=your-key \
node web/scripts/production-test.mjs
```

### Monitoring

- **Health Check**: `GET /api/health` - Use for uptime monitoring
- **Logs**: Vercel dashboard → Logs (JSON structured logs)
- **Errors**: Check React error boundary fallbacks
- **Audit Trail**: Query `audit_logs` table in Supabase

## 🔍 Debugging

### Common Issues

**Build fails with "Module not found"**
- Ensure all imports use correct casing (case-sensitive in production)
- Check that all dependencies are in package.json

**API returns 401 Unauthorized**
- Verify INTERNAL_API_KEY matches on client and server
- Check HMAC signature calculation (sign correct payload)

**Rate limit triggered unexpectedly**
- Check if multiple IPs behind same proxy
- Adjust RATE_LIMIT_MAX in `lib/rateLimit.ts` if needed

**Database errors "permission denied"**
- Verify RLS policies allow the operation
- Check that service role key is set correctly

### Logs

```bash
# View structured logs in Vercel
vercel logs <deployment-url>

# Query audit logs
# In Supabase SQL Editor:
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

## 📚 Additional Documentation

- [Production Hardening Details](../PRODUCTION_HARDENING.md)
- [Supabase Migrations](../supabase/migrations/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Create feature branch
2. Make changes with tests
3. Ensure `npm run build` passes
4. Submit pull request

## 📄 License

[Add your license here]

---

**Production Ready** ✅ | Next.js 16 | React 19 | Supabase | Vercel

