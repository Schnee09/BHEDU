# 🚀 Quick Deployment Checklist

Use this as a quick reference while deploying. See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] All errors fixed (`get_errors` output clean)
- [ ] Build passes locally (`npm run build` in web/)

## 1. Supabase Database

Open: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql

Apply migrations in SQL Editor (one at a time, in order):

- [ ] 001_schema.sql (Core tables)
- [ ] 002_rls_policies.sql (Base RLS)
- [ ] 003_rpc_get_student_metrics.sql (RPC function)
- [ ] 004_courses_lessons_schema.sql (Courses/lessons)
- [ ] 005_courses_lessons_rls.sql (Courses RLS)
- [ ] 006_fix_rls_circular_dependency.sql (Fix recursion)
- [ ] 007_rls_security_definer_functions.sql (Helper functions)
- [ ] 008_users_compat_view.sql (Users view)
- [ ] 009_users_view_add_email.sql (Add email)
- [ ] 010_add_performance_indexes.sql (Performance)
- [ ] 011_audit_logs.sql (Audit trail)

Verify:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```
Expected: assignments, attendance, audit_logs, classes, courses, enrollments, lessons, profiles, scores, submissions, users

## 2. Get Credentials

From Supabase Dashboard → Settings → API:
- [ ] Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SECRET!

Generate Internal API Key:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- [ ] Copy output → `INTERNAL_API_KEY`

## 3. Vercel Deployment

Go to: https://vercel.com/new

- [ ] Import GitHub repo: `Schnee09/BHEDU`
- [ ] Set Root Directory: `web`
- [ ] Set Framework: Next.js

Add Environment Variables (all environments):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
INTERNAL_API_KEY=xxxxx
```

- [ ] Click Deploy
- [ ] Wait for build to complete (~2-3 min)

## 4. Create Admin User

Sign up via app UI, then in SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'USER_ID_FROM_AUTH_USERS';
```

- [ ] Admin user created and verified

## 5. Test Deployment

```powershell
# Health check
curl https://your-app.vercel.app/api/health

# Set env vars
$env:BASE_URL="https://your-app.vercel.app"
$env:INTERNAL_API_KEY="your-key"

# Run production tests
node web/scripts/production-test.mjs
```

- [ ] Health check returns 200 OK
- [ ] Production tests pass
- [ ] Login/signup works
- [ ] Admin pages accessible
- [ ] Course creation works

## 6. Monitoring Setup

- [ ] Set up uptime monitoring on `/api/health`
- [ ] Configure Vercel notifications
- [ ] Review Supabase usage dashboard

## ✅ Deployment Complete!

Your application is now live at: `https://your-app.vercel.app`

For troubleshooting, see `DEPLOYMENT_GUIDE.md` → Troubleshooting section.
