# 🚀 Production Deployment Guide

Complete guide to deploy BH-EDU to production: Supabase → Vercel Web App

## Prerequisites

- ✅ Supabase account and project created
- ✅ Vercel account (GitHub connected)
- ✅ GitHub repository pushed

---

## Step 1: Deploy Supabase Database (Migrations)

Since Supabase CLI is not installed locally, use the **Supabase Dashboard SQL Editor**.

### 1.1 Access Your Project

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**

### 1.2 Apply Migrations in Order

**IMPORTANT**: Apply these migrations in the exact order listed. Each migration builds on the previous ones.

#### Migration 001: Core Schema
```sql
-- Copy entire contents of: supabase/migrations/001_schema.sql
-- Creates: profiles, classes, enrollments, assignments, submissions, scores, attendance
```
**Run** → Wait for success ✅

#### Migration 002: RLS Policies
```sql
-- Copy entire contents of: supabase/migrations/002_rls_policies.sql
-- Creates: Row-Level Security policies for all base tables
```
**Run** → Wait for success ✅

#### Migration 003: RPC Functions
```sql
-- Copy entire contents of: supabase/migrations/003_rpc_get_student_metrics.sql
-- Creates: get_student_metrics() function for dashboard
```
**Run** → Wait for success ✅

#### Migration 004: Courses & Lessons Schema
```sql
-- Copy entire contents of: supabase/migrations/004_courses_lessons_schema.sql
-- Creates: courses and lessons tables with triggers
```
**Run** → Wait for success ✅

#### Migration 005: Courses/Lessons RLS
```sql
-- Copy entire contents of: supabase/migrations/005_courses_lessons_rls.sql
-- Creates: RLS policies for courses and lessons
```
**Run** → Wait for success ✅

#### Migration 006: Fix RLS Circular Dependencies
```sql
-- Copy entire contents of: supabase/migrations/006_fix_rls_circular_dependency.sql
-- Fixes: Recursive RLS policy issues using IN subqueries
```
**Run** → Wait for success ✅

#### Migration 007: Security Definer Functions
```sql
-- Copy entire contents of: supabase/migrations/007_rls_security_definer_functions.sql
-- Creates: Helper functions to break RLS recursion
-- Critical for dashboard queries to work properly
```
**Run** → Wait for success ✅

#### Migration 008: Users Compatibility View
```sql
-- Copy entire contents of: supabase/migrations/008_users_compat_view.sql
-- Creates: public.users view mapping to profiles
```
**Run** → Wait for success ✅

#### Migration 009: Add Email to Users View
```sql
-- Copy entire contents of: supabase/migrations/009_users_view_add_email.sql
-- Updates: public.users view to include email from auth.users
```
**Run** → Wait for success ✅

#### Migration 010: Performance Indexes ⚡
```sql
-- Copy entire contents of: supabase/migrations/010_add_performance_indexes.sql
-- Creates: 20+ indexes on foreign keys and query patterns
-- This improves query performance significantly
```
**Run** → Wait for success ✅

#### Migration 011: Audit Logs 📝
```sql
-- Copy entire contents of: supabase/migrations/011_audit_logs.sql
-- Creates: audit_logs table for tracking admin actions
```
**Run** → Wait for success ✅

### 1.3 Verify Migrations

Run this verification query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- assignments, attendance, audit_logs, classes, courses, 
-- enrollments, lessons, profiles, scores, submissions, users (view)

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All tables should have rowsecurity = true

-- Test audit_logs table
SELECT COUNT(*) FROM audit_logs;
-- Should return 0 (empty table)
```

✅ **If all queries succeed, your database is ready!**

---

## Step 2: Create Admin User

You need at least one admin user to access `/admin/courses`.

### Option A: Signup via UI + Manual Update

1. Sign up a user at: `https://your-vercel-app.vercel.app/signup`
2. Get the user ID from `auth.users` table
3. Run in SQL Editor:

```sql
-- Update user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_ID_HERE';

-- Verify
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

### Option B: Create Admin Directly

```sql
-- Insert admin user (requires auth.users entry first)
-- You must sign up via the app UI first, then run this:
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
```

---

## Step 3: Deploy Web App to Vercel

### 3.1 Get Supabase Credentials

From Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Keep secret!

### 3.2 Generate Internal API Key

Run this in your terminal:

```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your `INTERNAL_API_KEY`.

### 3.3 Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended for First Deploy)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `Schnee09/BHEDU`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Add Environment Variables**:

   Click "Environment Variables" and add these:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   INTERNAL_API_KEY=your-generated-key-here
   ```

   ⚠️ **IMPORTANT**: 
   - Check "Production", "Preview", and "Development" for all variables
   - Double-check there are no extra spaces or newlines

5. Click **Deploy**

6. Wait for deployment (usually 2-3 minutes)

#### Option B: Via GitHub (Auto-Deploy on Push)

If you already have Vercel connected to your GitHub repo:

1. Ensure environment variables are set in Vercel Dashboard
2. Push to your repository:

```powershell
git add .
git commit -m "Production ready deployment"
git push origin chore/vercel-integration
```

3. Vercel will automatically deploy

### 3.4 Verify Deployment

Once deployed, test these endpoints:

```powershell
# 1. Health check
curl https://your-app.vercel.app/api/health

# Expected: {"status":"ok","timestamp":"...","database":"connected"}

# 2. Test HMAC authentication (use your INTERNAL_API_KEY)
node web/scripts/hmac-request.mjs `
  --url https://your-app.vercel.app/api/courses `
  --method GET

# Expected: {"data":[]} (empty array if no courses yet)
```

### 3.5 Run Production Test Suite

Set environment variables and run comprehensive tests:

```powershell
$env:BASE_URL="https://your-app.vercel.app"
$env:INTERNAL_API_KEY="your-key-here"
node web/scripts/production-test.mjs
```

Expected output:
```
🚀 Production Readiness Test Suite
✅ Health Check - Status: 200
✅ List Courses - Status: 200
✅ Create Course - Status: 201
✅ Authentication working correctly
✅ Validation working correctly
🎉 All tests passed! Application is production ready.
```

---

## Step 4: Post-Deployment Checklist

### 4.1 Security Verification

- [ ] Service role key is **not** exposed in client-side code
- [ ] INTERNAL_API_KEY is kept secret (not in git)
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] Rate limiting tested (65 rapid requests should trigger 429)
- [ ] Admin pages require authentication

### 4.2 Functionality Verification

- [ ] Login/Signup works
- [ ] Dashboard loads for teachers/students
- [ ] Admin can access `/admin/courses`
- [ ] Non-admins redirected from admin pages
- [ ] Course creation works
- [ ] Lesson creation works
- [ ] Edit/delete operations work
- [ ] Toast notifications appear

### 4.3 Performance Verification

- [ ] Database queries complete in < 100ms (check Supabase Dashboard → Database → Query Performance)
- [ ] Page loads complete in < 2s
- [ ] Build size is reasonable (check Vercel deployment logs)

### 4.4 Set Up Monitoring

**Vercel:**
- Go to your project → **Settings** → **Integrations**
- Consider adding: Sentry (errors), Logtail (logs), Checkly (uptime)

**Supabase:**
- Go to **Database** → **Query Performance** - monitor slow queries
- Go to **Auth** → **Users** - monitor user growth
- Go to **Storage** (if using) - monitor usage

**Health Check Monitoring:**
Set up external monitoring on `https://your-app.vercel.app/api/health`
- UptimeRobot (free): https://uptimerobot.com
- Checkly: https://www.checklyhq.com
- StatusCake: https://www.statuscake.com

---

## Step 5: Domain Setup (Optional)

### 5.1 Add Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `bh-edu.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)
5. Vercel automatically provisions SSL certificate

### 5.2 Update Environment Variables

If using custom domain, update:
```
NEXT_PUBLIC_BASE_URL=https://bh-edu.com
```

---

## Troubleshooting

### Build Fails

**"Module not found" errors:**
```powershell
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

**TypeScript errors:**
- Check `get_errors` output
- Ensure all migrations applied correctly
- Verify environment variables are set

### Runtime Errors

**"Cannot read properties of undefined":**
- Check browser console for client-side errors
- Verify Supabase anon key is correct
- Check that RLS policies allow the operation

**500 Internal Server Error:**
- Check Vercel Function Logs (Dashboard → Your Project → Logs)
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check that database migrations completed successfully

**401 Unauthorized on API routes:**
- Verify INTERNAL_API_KEY matches on both client and server
- Check HMAC signature calculation in request

### Database Errors

**"permission denied for table":**
- Verify RLS policies were created (migrations 002, 005, 006, 007)
- Check that security definer functions exist (migration 007)
- Ensure service role key is set correctly

**"relation does not exist":**
- Check that all migrations were applied in order
- Verify table names match exactly (case-sensitive)

---

## Quick Reference Commands

### Test API Endpoints
```powershell
# Set environment variables
$env:BASE_URL="https://your-app.vercel.app"
$env:INTERNAL_API_KEY="your-key"

# Run HMAC-signed request
node web/scripts/hmac-request.mjs --url $env:BASE_URL/api/courses --method GET

# Run full test suite
node web/scripts/production-test.mjs
```

### View Logs
```powershell
# Vercel logs (install Vercel CLI)
vercel logs https://your-app.vercel.app
```

### Query Database
```sql
-- Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;

-- Check active users
SELECT email, role, created_at FROM profiles ORDER BY created_at DESC;

-- Check courses
SELECT id, title, is_published, author_id FROM courses;

-- Check RLS policy usage
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Production Hardening Details**: See `PRODUCTION_HARDENING.md`
- **Code Documentation**: See `web/README.md`

---

## Summary

You've successfully deployed:

✅ **Supabase Database**
- 11 migrations applied
- All tables, views, indexes, and RLS policies in place
- Audit logging configured

✅ **Next.js Web App on Vercel**
- Production build deployed
- Environment variables configured
- Security headers enabled
- Rate limiting active
- Health check endpoint live

✅ **Production Ready**
- Error handling in place
- Structured logging configured
- Admin UI functional
- API authentication working

🎉 **Your BH-EDU application is now live in production!**

For ongoing maintenance, see the "Maintenance" section in `PRODUCTION_HARDENING.md`.
