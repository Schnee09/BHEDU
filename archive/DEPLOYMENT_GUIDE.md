# 🚀 BH-EDU Deployment & Testing Guide

**Status**: Ready for deployment after completing steps below  
**Last Updated**: November 21, 2025

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Apply `supabase/COMPLETE_STUDENT_MANAGEMENT.sql` to Supabase
- [ ] Run `supabase/COMPLETE_TEST_SEED.sql` for reference data
- [ ] Run `web/scripts/seed-auth-users.js` to create test users
- [ ] Verify tables exist via health check

### 2. Security
- [ ] Remove `SUPABASE_SERVICE_ROLE_KEY` from `web/.env.local`
- [ ] Add service key to platform secrets (Vercel/Netlify)
- [ ] Rotate service key if previously exposed
- [ ] Verify RLS policies enabled on all tables

### 3. Code Cleanup
- [ ] Delete `web/lib/supabaseClient.ts` (replaced by `web/lib/supabase/client.ts`)
- [ ] Update imports to use new client paths
- [ ] Remove unused API routes (if any)
- [ ] Run linter: `pnpm lint:fix`

### 4. Dependencies
- [ ] Remove `package-lock.json` files (use pnpm only)
- [ ] Run `pnpm install` in `web/`
- [ ] Verify all dependencies are installed

---

## 🗄️ Database Deployment

### Option A: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/COMPLETE_STUDENT_MANAGEMENT.sql`
3. Paste and click "Run"
4. Wait for completion (may take 30-60 seconds)
5. Copy contents of `supabase/COMPLETE_TEST_SEED.sql`
6. Paste and click "Run"

### Option B: Supabase CLI
```bash
cd supabase

# Apply schema
supabase db push

# Or apply SQL file directly
type COMPLETE_STUDENT_MANAGEMENT.sql | supabase db execute

# Apply seed data
type COMPLETE_TEST_SEED.sql | supabase db execute
```

### Option C: PostgreSQL Client
```bash
# If you have direct database access
psql postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres \
  -f supabase/COMPLETE_STUDENT_MANAGEMENT.sql

psql postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres \
  -f supabase/COMPLETE_TEST_SEED.sql
```

---

## 👥 Create Test Users & Sample Data

### Option 1: Complete Seed (Recommended) 
Creates users, profiles, classes, enrollments, assignments, scores, and attendance.

**Step 1:** Ensure `.env` file exists in `web/` folder with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 2:** Run the TypeScript seed script:
```bash
cd web
npx tsx scripts/seed.ts
```

This script will:
- ♻️ **Replace any existing users** with the same email (force delete + recreate)
- Create 6 test users (1 admin, 1 teacher, 4 students)
- Create 2 sample classes (Math 101, Science 102)
- Enroll students in classes
- Create sample assignments, scores, and attendance records

### Option 2: Auth Users Only
Only creates auth users and profiles (no sample data).

```bash
cd web
node scripts/seed-auth-users.js
```

**Alternative**: Set environment variables inline (PowerShell):
```powershell
cd web
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/seed-auth-users.js
```

**Alternative**: Set environment variables inline (CMD):
```cmd
cd web
set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co && set SUPABASE_SERVICE_ROLE_KEY=your-key && node scripts/seed-auth-users.js
```

### Expected Output
```
🌍 Using Supabase URL: https://mwncwhkdimnjovxzhtjm.supabase.co
� Using Service Key Prefix: eyJhbGciOiJIUzI1N
♻️  Mode: Replace existing users

🌱 Starting Supabase seed (force replace mode)...

👥 Processing users (deleting old, creating new)...
🗑️  Removed old user: admin@bhedu.com (ID: xxx-xxx-xxx)
✅ Created user: admin@bhedu.com (ID: yyy-yyy-yyy)
✅ Profile linked for admin@bhedu.com
🗑️  Removed old user: teacher@bhedu.com (ID: xxx-xxx-xxx)
✅ Created user: teacher@bhedu.com (ID: yyy-yyy-yyy)
✅ Profile linked for teacher@bhedu.com
...

✅ All users created and profiles linked!

→ Ensuring sample classes...
✅ Classes created
→ Creating enrollments...
✅ Enrolled sara@student.com → Class xxx
...
→ Creating assignments...
✅ Assignments created
→ Inserting scores...
✅ Scores inserted
→ Recording attendance...
✅ Attendance recorded

🌟 Seeding complete!

📝 Test credentials:
   Admin: admin@bhedu.com / admin123
   Teacher: teacher@bhedu.com / teacher123
   Students: sara@student.com, charlie@student.com, dana@student.com, alex@student.com / student123
```

---

## 🧪 Testing

### 1. Health Check

The health check script now automatically loads from `web/.env`, so just run:

```bash
cd web
node scripts/health-check.js
```

If you don't have a `.env` file, set variables inline (PowerShell):
```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"; node scripts/health-check.js
```

### Expected Output
```
╔══════════════════════════════════════╗
║  BH-EDU API Health Check & Test      ║
╚══════════════════════════════════════╝

🔍 Testing Supabase Connection...

✅ Supabase connection: OK

🔍 Testing Reference Tables...

✅ Table 'academic_years': OK (3 rows)
✅ Table 'grading_scales': OK (2 rows)
✅ Table 'payment_methods': OK (6 rows)
✅ Table 'fee_types': OK (10 rows)

🔍 Testing Core Tables...

✅ Table 'profiles': OK (4 rows)
✅ Table 'classes': OK (0 rows)
✅ Table 'enrollments': OK (0 rows)
✅ Table 'guardians': OK (0 rows)
✅ Table 'attendance': OK (0 rows)
✅ Table 'qr_codes': OK (0 rows)
✅ Table 'audit_logs': OK (0 rows)

╔══════════════════════════════════════╗
║  ✅ Health Check: PASSED             ║
╚══════════════════════════════════════╝
```

### 2. Manual Database Check
Go to Supabase Dashboard → Table Editor and verify:
- `profiles` table has 4 rows (admin, teacher, 2 students)
- All profiles have `user_id` linked to auth users
- `academic_years` has 3 rows
- `grading_scales` has 2 rows
- RLS is enabled on all tables (shield icon visible)

### 3. Test API Endpoints

#### Test Student List
```bash
curl http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status": "ok", "timestamp": "..."}`

---

## 🌐 Frontend Deployment

### Vercel (Recommended)
```bash
cd web

# Install Vercel CLI (if not installed)
pnpm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key (server-side only!)
   ```
3. Select: Production, Preview, Development
4. Redeploy

### Netlify
```bash
cd web

# Install Netlify CLI
pnpm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Add environment variables in Site Settings → Build & Deploy → Environment.

---

## 🐛 Troubleshooting

### "Table does not exist"
→ Schema not applied. Run `COMPLETE_STUDENT_MANAGEMENT.sql` in Supabase dashboard.

### "Permission denied for table"
→ RLS policies not applied or user not authenticated. Check RLS policies and auth session.

### "Missing environment variables"
→ Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### "Service role key not found"
→ Add `SUPABASE_SERVICE_ROLE_KEY` to platform secrets (Vercel/Netlify), NOT `.env.local`.

### Build fails with TypeScript errors
→ Run `pnpm run typecheck` to see errors. May need to update imports or fix type issues.

### Auth users not created
→ Ensure service role key is correct. Check Supabase logs for errors.

---

## ✅ Post-Deployment Verification

1. **Visit deployed URL** (e.g., `https://bh-edu.vercel.app`)
2. **Test login** with `admin@bhedu.com` / `admin123`
3. **Check dashboard** loads correctly
4. **Test student CRUD**:
   - Create a new student
   - View student list
   - Update student details
   - Delete student (if permitted)
5. **Check logs** in Vercel/Netlify for errors
6. **Monitor Supabase** dashboard for query performance

---

## 📊 Success Metrics

- ✅ All tables exist in Supabase
- ✅ Health check passes
- ✅ Test users can login
- ✅ API endpoints return data
- ✅ No console errors in browser
- ✅ RLS policies enforced
- ✅ No service key exposed to client

---

## 📞 Next Steps

After deployment:
1. Change test user passwords to secure values
2. Create real users via signup flow or admin panel
3. Add real student/class/attendance data
4. Monitor error logs and performance
5. Set up automated backups in Supabase
6. Configure custom domain (if needed)

---

**Ready to deploy? Start with the Pre-Deployment Checklist above!**
