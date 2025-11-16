# 🚀 Deployment Checklist for BH-EDU

## Pre-Deployment Setup

### 1. Database Setup ✅

- [x] All migrations applied (027-030)
- [x] RLS policies in place
- [x] `is_admin()` security definer function created
- [ ] **Seed database with test data**

### 2. Environment Variables

#### Required for Production (Vercel)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: Only needed for user management endpoints
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-key
```

#### Local Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Seed Test Data

```bash
# Step 1: Create auth users
cd web
node ../scripts/create-test-users.js

# Step 2: Apply migrations and seed
npx supabase db reset

# Or manually:
npx supabase db push
psql $DATABASE_URL < ../supabase/seed_comprehensive.sql
```

## 📦 What's Ready to Deploy

### Backend (Database)
- ✅ RLS policies for all tables (25+ tables)
- ✅ Security definer functions (`is_admin()`)
- ✅ Comprehensive migrations (027-030)
- ✅ Seed data script ready

### API Routes (21+ routes converted)
- ✅ Cookie-based authentication
- ✅ No service-role dependency for most routes
- ✅ Admin/Teacher/Student access patterns

### Frontend Pages
- ✅ Dashboard pages
- ✅ Notifications page
- ✅ Profile page
- ✅ All existing pages

### Type Safety
- ✅ All TypeScript errors resolved
- ✅ Profile types updated
- ✅ Proper type definitions

## 🧪 Testing Before Deploy

### 1. Test Locally

```bash
# Start local Supabase
npx supabase start

# Seed database
npm run db:seed

# Start dev server
npm run dev

# Test in browser
open http://localhost:3000
```

### 2. Test Different Roles

| Role | Email | Test Cases |
|------|-------|------------|
| **Admin** | admin@bhedu.example.com | - View all classes<br>- Manage users<br>- Finance reports<br>- System settings |
| **Teacher** | john.doe@bhedu.example.com | - View assigned classes<br>- Mark attendance<br>- Grade assignments<br>- View student list |
| **Student** | alice.anderson@student.bhedu.example.com | - View enrolled classes<br>- Check grades<br>- View assignments<br>- See attendance |

### 3. Critical Endpoints to Test

```bash
# Classes
GET /api/classes/my-classes

# Attendance
GET /api/attendance/reports
POST /api/attendance/bulk

# Grades
GET /api/grades
POST /api/grades/assignments

# Finance (Admin only)
GET /api/admin/finance/reports
GET /api/admin/finance/invoices

# User Management (Needs service key)
POST /api/admin/users
PUT /api/admin/users/[id]
```

## 📋 Deployment Steps

### 1. Push to Git

```bash
git add .
git commit -m "feat: Add comprehensive seed data and complete API migration"
git push origin main
```

### 2. Deploy to Vercel

```bash
# Option 1: Auto-deploy (if connected to GitHub)
# Just push to main branch

# Option 2: Manual deploy
vercel --prod
```

### 3. Set Environment Variables in Vercel

```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Optional (only for user creation)
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Or via Dashboard:
# https://vercel.com/your-project/settings/environment-variables
```

### 4. Seed Production Database

```bash
# Option 1: From local machine
# Set DATABASE_URL to production
psql $PRODUCTION_DATABASE_URL < supabase/seed_comprehensive.sql

# Option 2: Via Supabase Dashboard
# Go to SQL Editor and paste seed_comprehensive.sql

# Option 3: Via Supabase CLI
supabase db push --db-url $PRODUCTION_DATABASE_URL
```

## ✅ Post-Deployment Verification

### 1. Check Health
- [ ] Website loads: https://your-app.vercel.app
- [ ] Login works for all roles
- [ ] No console errors
- [ ] No 500 errors in Vercel logs

### 2. Test Core Features
- [ ] Admin can view all classes
- [ ] Teacher can mark attendance
- [ ] Student can view grades
- [ ] Finance reports work
- [ ] Notifications appear
- [ ] Profile editing works

### 3. Monitor Logs

```bash
# Vercel logs
vercel logs --prod

# Supabase logs
# Dashboard > Logs > API Logs
# Check for RLS policy denials
```

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] Admin checks use `is_admin()` function
- [x] Service role key not required for most operations
- [x] Cookie-based auth implemented
- [x] Proper role-based access control
- [ ] SSL/HTTPS enabled (automatic on Vercel)
- [ ] Supabase Auth configured with proper redirect URLs

## 🐛 Common Issues & Fixes

### Issue: "Infinite recursion" error
**Status**: ✅ Fixed (migration 027)
**Fix**: `is_admin()` security definer function

### Issue: 500 errors on API routes
**Status**: ✅ Fixed (migrations 028-030)
**Fix**: Added comprehensive RLS policies

### Issue: "Cannot read properties of undefined"
**Status**: ✅ Fixed
**Fix**: Updated Profile types + type casting

### Issue: Users can't be created
**Cause**: Requires `SUPABASE_SERVICE_ROLE_KEY`
**Solution**: Add service key to Vercel env vars

### Issue: Students can see other students' data
**Check**: RLS policies enforce `student_id = auth.uid()`
**Verify**: Test with student account

## 📊 Test Data Summary

After seeding, you'll have:

- **14 Users**: 2 admins, 4 teachers, 8 students
- **5 Classes**: Various subjects with realistic schedules
- **24 Enrollments**: Students in 3-4 classes each
- **200+ Attendance Records**: Last 2 weeks with realistic patterns
- **30+ Assignments**: Past, current, and future
- **50+ Submissions**: With grades (70-100%)
- **Complete Finance Data**: Invoices, payments, balances
- **Guardians, QR Codes, Notifications**: Full ecosystem

## 📞 Support

### Documentation
- [MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md) - API migration details
- [SEEDING.md](./SEEDING.md) - Detailed seeding guide
- [Supabase Docs](https://supabase.com/docs)

### Quick Commands
```bash
# Reset everything
npm run db:reset

# Create test users only
npm run db:users

# Apply migrations
npm run db:migrate

# Full seed (users + data)
npm run db:seed
```

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ All test accounts can login
2. ✅ Admin sees all classes and students
3. ✅ Teacher sees only their classes
4. ✅ Student sees only their enrolled classes
5. ✅ Attendance can be marked
6. ✅ Grades can be assigned
7. ✅ Finance reports show correct data
8. ✅ No 500 errors in logs
9. ✅ No RLS policy denials
10. ✅ Page load times < 3 seconds

---

**Last Updated**: November 16, 2025  
**Status**: Ready for deployment ✅  
**Version**: 1.0.0
