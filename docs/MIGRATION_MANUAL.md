# 🚀 Manual Migration & Account Setup Guide

**If you want to complete the setup right now**, follow these steps:

## Step 1: Run the Migration in Supabase (2 minutes)

### Option A: Using Supabase Web Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project: `BH-EDU`

2. **Open SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New Query"

3. **Copy the Migration SQL**
   - Open file: `supabase/migrations/20241209_add_staff_role_complete.sql`
   - Copy ALL the content

4. **Paste into Supabase**
   - Paste into the SQL editor
   - Click the "RUN" button (or Ctrl+Enter)

5. **Verify Success**
   - Should see green checkmarks ✅
   - No error messages
   - Table constraints updated

### Option B: Using Supabase CLI (If you have it)

```bash
cd e:\TTGDBH\BH-EDU
supabase migration up
```

---

## Step 2: Create Test Accounts (Already Done! ✅)

The script already created accounts for:
- **admin@test.com** → Created ✅
- **teacher@test.com** → Created ✅  
- **student@test.com** → Created ✅
- **staff@test.com** → Awaiting database constraint

**Once you run the migration above**, run this command:

```bash
node scripts\setup-4role-commonjs.js
```

It will:
1. Check if accounts exist
2. Update the staff account now that the constraint exists
3. Display all credentials

---

## Step 3: Test the Login

1. **Start the dev server** (if not already running)
   ```bash
   cd web
   npm run dev
   ```

2. **Visit the login page**
   - http://localhost:3000/login

3. **Test each account**
   ```
   Admin:   admin@test.com    / test123
   Staff:   staff@test.com    / test123
   Teacher: teacher@test.com  / test123
   Student: student@test.com  / test123
   ```

4. **Verify sidebar per role**
   - Admin → 8 sections (full access)
   - Staff → 7 sections (operational only)
   - Teacher → 4 sections (classes/grades)
   - Student → 5 sections (own data)

---

## 📋 Quick Checklist

```
Step 1: Run Migration
 [ ] Go to Supabase Dashboard
 [ ] Open SQL Editor
 [ ] Copy file: supabase/migrations/20241209_add_staff_role_complete.sql
 [ ] Paste & RUN
 [ ] Verify success (no errors)

Step 2: Update Accounts
 [ ] Run: node scripts\setup-4role-commonjs.js
 [ ] All 4 accounts should now show ✅

Step 3: Test Login
 [ ] npm run dev (in web/ directory)
 [ ] Visit http://localhost:3000/login
 [ ] Test all 4 accounts
 [ ] Verify sidebar sections per role
 [ ] Check API access

✅ Done!
```

---

## 🔗 Important Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20241209_add_staff_role_complete.sql` | **Migration to run in Supabase** |
| `scripts/setup-4role-commonjs.js` | **Creates test accounts** |
| `web/lib/auth/permissions.ts` | **Role permission logic** |
| `web/components/Sidebar.tsx` | **Role-based sidebar** |

---

## ❓ Troubleshooting

### Migration fails with "constraint already exists"
- **Cause**: Migration already ran
- **Fix**: No action needed, continue to next step

### Staff account still fails to create
- **Cause**: Migration hasn't run yet
- **Fix**: Make sure to run the migration in Supabase first

### Can't login after setting up accounts
- **Cause**: Migration needed, or browser cache
- **Fix**: 
  1. Clear browser cookies (Ctrl+Shift+Delete)
  2. Try logging in again
  3. Make sure migration was actually executed

### Sidebar sections incorrect for role
- **Cause**: Database role not updated, or auth cache
- **Fix**: 
  1. Clear browser cookies
  2. Logout and login again
  3. Check database: `select email, role from profiles limit 10`

---

## 📞 Need Help?

Everything is automated except for the **Supabase SQL migration** step, which requires manual action since Supabase doesn't allow SDK-based SQL execution for DDL (table structure changes).

**You must run the migration through the Supabase web dashboard.**

Once done, everything else is automated:
- ✅ Test accounts created
- ✅ Sidebar per role
- ✅ API permissions enforced
- ✅ Database roles assigned

---

## 📊 What Gets Created

### Database Changes
- `profiles.role` constraint updated: `'admin' | 'staff' | 'teacher' | 'student'`
- RLS policies for staff role
- Permissions for staff in all tables

### Test Accounts
```
Email              | Password | Role
───────────────────┼──────────┼────────────
admin@test.com     | test123  | admin
staff@test.com     | test123  | staff
teacher@test.com   | test123  | teacher
student@test.com   | test123  | student
```

### Sidebar Sections

**Admin (all 8)**
- Dashboard
- People (users, staff, teachers, students)
- Academic (classes, curriculum)
- Attendance
- Grades
- Finance
- Configuration
- System

**Staff (7 - no System/Config)**
- Dashboard
- People
- Academic
- Attendance
- Grades
- Finance
- Reports

**Teacher (4)**
- Dashboard
- My Classes
- Attendance
- Grades

**Student (5)**
- Dashboard
- Learning
- Attendance
- Finance
- Profile

---

**Ready? Follow the steps above!** 🚀
