# 4-Role System Setup Guide

**Date**: December 9, 2025  
**Status**: Ready for Implementation

---

## 📋 Overview

This guide walks through implementing the 4-role system:
- Admin (Super Admin)
- Staff (Sub-Admin/Office Staff)  
- Teacher
- Student

---

## 🚀 Step 1: Apply Migration

### Option A: Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy & paste contents of: `supabase/migrations/20241209_add_staff_role_complete.sql`
6. Click **Run**
7. Verify: "✅ Migration complete!" appears

### Option B: Supabase CLI

```bash
cd e:\TTGDBH\BH-EDU
supabase db push
```

### Option C: Node Script (Advanced)

```bash
cd e:\TTGDBH\BH-EDU
node scripts/setup-4role-system.js
```

---

## 👥 Step 2: Create Test Accounts

### Option A: Supabase Dashboard (Recommended)

**Create Admin Account:**
1. Go to **Auth** > **Users**
2. Click **Add User**
3. Email: `admin@test.com`
4. Password: `test123`
5. Check **Auto confirm email**
6. Click **Create user**
7. Go to **SQL Editor**
8. Run this query:
   ```sql
   UPDATE profiles 
   SET role = 'admin', full_name = 'Admin User'
   WHERE email = 'admin@test.com';
   ```

**Repeat for Staff:**
```sql
-- Create via Auth, then update:
UPDATE profiles 
SET role = 'staff', full_name = 'Staff User'
WHERE email = 'staff@test.com';
```

**Repeat for Teacher:**
```sql
UPDATE profiles 
SET role = 'teacher', full_name = 'Teacher User'
WHERE email = 'teacher@test.com';
```

**Repeat for Student:**
```sql
UPDATE profiles 
SET role = 'student', full_name = 'Student User'
WHERE email = 'student@test.com';
```

### Option B: Node Script

```bash
cd e:\TTGDBH\BH-EDU
npx ts-node scripts/create-4role-test-users.ts
```

Or if TypeScript not set up:
```bash
cd e:\TTGDBH\BH-EDU
node scripts/setup-4role-system.js
```

---

## 🔑 Step 3: Test Login Credentials

Once created, use these to test:

```
Role      | Email              | Password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
admin     | admin@test.com     | test123
staff     | staff@test.com     | test123
teacher   | teacher@test.com   | test123
student   | student@test.com   | test123
```

---

## ✅ Step 4: Verify Setup

### 1. Check Migration Applied
```sql
-- In Supabase SQL Editor, run:
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name='profiles' AND constraint_name LIKE '%role%';

-- Should return: profiles_role_check
```

### 2. Check Accounts Created
```sql
SELECT id, email, role, full_name 
FROM profiles 
WHERE email IN ('admin@test.com', 'staff@test.com', 'teacher@test.com', 'student@test.com')
ORDER BY role;
```

### 3. Test Web App Login

1. Go to http://localhost:3000/login
2. Try each account:
   - Admin → Should see full sidebar with Settings/System sections
   - Staff → Should see operational sidebar (no Settings/System)
   - Teacher → Should see teaching-focused sidebar
   - Student → Should see student-focused sidebar

---

## 🎯 Expected Sidebar Behavior

### Admin Sidebar (Full Access)
```
📊 Dashboard
├── 🏠 Home

👥 People
├── 👨‍🎓 Students
├── 👔 Staff
├── 👨‍🏫 Teachers
├── 👤 All Users
├── 📥 Import

📚 Academics
├── 📖 Courses
├── 🏫 Classes
├── 📋 Assignments

✓ Attendance
├── 📊 Overview
├── ✅ Mark Attendance
├── 📱 QR Codes
├── 📈 Reports

📝 Grades
├── 📊 Overview
├── ✏️ Grade Entry
├── 📋 Assignments
├── 📄 Report Cards
├── 📈 Analytics

💰 Finance
├── 💳 Student Accounts
├── 📑 Invoices
├── 💵 Payments
├── 📊 Reports

⚙️ Configuration
├── 📅 Academic Years
├── 📊 Grading Scales
├── 🏷️ Fee Types
├── ⚙️ Settings

🔧 System
├── 🔧 Diagnostics
├── 📦 Data Management
├── 📊 System Reports
```

### Staff Sidebar (Operations)
```
📊 Dashboard
├── 🏠 Home

👥 People
├── 👨‍🎓 Students
├── 👨‍🏫 Teachers
├── 📥 Import

📚 Academics
├── 📖 Courses
├── 🏫 Classes

✓ Attendance
├── 📊 Overview
├── ✅ Mark Attendance
├── 📱 QR Codes
├── 📈 Reports

📝 Grades
├── 📊 Overview
├── 📄 Report Cards
├── 📈 Analytics

💰 Finance
├── 💳 Student Accounts
├── 📑 Invoices
├── 💵 Payments
├── 📊 Reports

📊 Reports
├── 📈 All Reports
├── 📥 Data Export
```

### Teacher Sidebar
```
📊 Dashboard
├── 🏠 Home

📚 My Classes
├── 🏫 Classes
├── 📖 Courses
├── 👨‍🎓 My Students

✓ Attendance
├── ✅ Mark Attendance
├── 📱 QR Codes
├── 📈 Reports

📝 Grades
├── 📋 Assignments
├── ✏️ Grade Entry
├── 🎓 Conduct Grades
├── 📄 Report Cards
├── 📈 Analytics
```

### Student Sidebar
```
📊 Dashboard
├── 🏠 Home

📚 Learning
├── 🏫 My Classes
├── 📋 Assignments
├── 📊 My Grades

✓ Attendance
├── 📅 My Attendance
├── 📱 QR Check-in

💰 Finance
├── 💳 My Account

👤 Profile
├── ⚙️ My Profile
├── 🔔 Notifications
```

---

## 🐛 Troubleshooting

### Migration Failed with "Already Exists" Error
- This is normal if you've run before
- Check that role constraint is updated:
  ```sql
  -- Should show both old and new constraint
  SELECT constraint_name FROM information_schema.table_constraints 
  WHERE table_name='profiles';
  ```
- RLS policies can be recreated without error (DROP IF EXISTS handles this)

### Accounts Not Appearing
1. Check Auth > Users in Supabase console
2. Verify profile was created for each user:
   ```sql
   SELECT id, email, role FROM profiles WHERE email LIKE '%test.com%';
   ```
3. If missing, create profiles manually:
   ```sql
   INSERT INTO profiles (user_id, email, full_name, role, is_active)
   SELECT id, email, email, 'teacher', true
   FROM auth.users
   WHERE email = 'teacher@test.com';
   ```

### Sidebar Not Showing New Sections
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors (F12)
3. Verify user role in database:
   ```sql
   SELECT role FROM profiles WHERE user_id = auth.uid();
   ```
4. Check Sidebar.tsx still has staff role in type definition

### Login Issues
1. Verify `.env.local` has correct Supabase credentials
2. Check that email is confirmed in Auth > Users
3. Try password reset if account creation is old

---

## 📚 Files Created/Modified

### New Files
- `supabase/migrations/20241209_add_staff_role.sql` - Original migration
- `supabase/migrations/20241209_add_staff_role_complete.sql` - Full with RLS
- `scripts/create-4role-test-users.ts` - TypeScript setup script
- `scripts/setup-4role-system.js` - Node.js setup script
- `supabase/ORGANIZATION.md` - Supabase structure documentation
- `docs/ROLE_BASED_ACCESS_MATRIX.md` - Role permissions matrix
- `docs/ROLE_IMPLEMENTATION_COMPLETE.md` - Implementation summary

### Modified Files
- `web/lib/database.types.ts` - Added `UserRole` type with 'staff'
- `web/lib/auth/permissions.ts` - Added staff permissions + helpers
- `web/lib/auth/adminAuth.ts` - Added `staffAuth()` function
- `web/components/Sidebar.tsx` - Added staff navigation
- `web/hooks/useUser.ts` - Added `isStaff`, `hasAdminAccess`
- `web/hooks/useProfile.ts` - Uses `UserRole` type
- `web/app/dashboard/users/page.tsx` - Uses `UserRole` type
- `web/app/api/**/*.ts` - Updated to use `hasAdminAccess()`

---

## ✨ What's Next

1. ✅ Migration applied
2. ✅ Test accounts created
3. ✅ Sidebar shows different sections per role
4. Next: Implement role-specific page access controls
5. Next: Create role-based feature flags

---

## 📞 Questions?

Check these files:
- `docs/ROLE_BASED_ACCESS_MATRIX.md` - Complete permissions matrix
- `docs/ROLE_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `supabase/ORGANIZATION.md` - Database organization
