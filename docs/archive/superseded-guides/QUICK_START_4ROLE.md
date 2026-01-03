# 🔐 4-Role System - Quick Start

**Just completed**: Full 4-role implementation (Admin, Staff, Teacher, Student)  
**Status**: Ready for manual database setup (20 minutes)

---

## 📋 What Is This?

A complete role-based access control system with:
- **Admin**: Super admin (you only) - full system access
- **Staff**: Sub-admin/office staff - operational access
- **Teacher**: Teaching functions - own classes only
- **Student**: Self-service - own data only

Each role sees a different sidebar and has appropriate API access.

---

## ⚡ Quick Setup (20 minutes)

### Step 1: Apply Migration (2-3 min)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy everything from: `supabase/migrations/20241209_add_staff_role_complete.sql`
5. Click **RUN**

✅ You should see: `Migration complete!`

### Step 2: Create Test Accounts (10 min)

Go to **Auth** → **Users** and click "Add User" for each:

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | test123 | admin |
| staff@test.com | test123 | staff |
| teacher@test.com | test123 | teacher |
| student@test.com | test123 | student |

**Don't forget**: Check **Auto confirm email** when creating each one!

### Step 3: Update Roles (1-2 min)

Go to **SQL Editor** → **New Query** and run:

```sql
UPDATE profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'staff', full_name = 'Staff User' WHERE email = 'staff@test.com';
UPDATE profiles SET role = 'teacher', full_name = 'Teacher User' WHERE email = 'teacher@test.com';
UPDATE profiles SET role = 'student', full_name = 'Student User' WHERE email = 'student@test.com';
```

### Step 4: Test (5 min)

1. Go to http://localhost:3000/login (make sure dev server is running)
2. Try logging in with each account:
   - **admin@test.com** → Should see full sidebar (Settings, System sections)
   - **staff@test.com** → Should see operational sidebar (no Settings/System)
   - **teacher@test.com** → Should see teaching sections only
   - **student@test.com** → Should see student sections only

---

## 📊 What You Get

### Admin Sidebar
```
📊 Dashboard, 👥 People, 📚 Academic, ✓ Attendance, 
📝 Grades, 💰 Finance, ⚙️ Configuration, 🔧 System
```

### Staff Sidebar
```
📊 Dashboard, 👥 People, 📚 Academic, ✓ Attendance, 
📝 Grades, 💰 Finance, 📊 Reports
```

### Teacher Sidebar
```
📊 Dashboard, 📚 My Classes, ✓ Attendance, 📝 Grades
```

### Student Sidebar
```
📊 Dashboard, 📚 Learning, ✓ Attendance, 💰 Finance, 👤 Profile
```

---

## 🔑 Test Account Credentials

```
Role      | Email              | Password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin     | admin@test.com     | test123
Staff     | staff@test.com     | test123
Teacher   | teacher@test.com   | test123
Student   | student@test.com   | test123
```

---

## 📚 Documentation

- **`docs/SETUP_4ROLE_SYSTEM.md`** - Complete step-by-step guide (with troubleshooting)
- **`docs/ROLE_BASED_ACCESS_MATRIX.md`** - Full permission matrix
- **`docs/IMPLEMENTATION_CHECKLIST.md`** - Implementation status & verification
- **`supabase/ORGANIZATION.md`** - Database structure

---

## ✅ Verify Setup

After creating accounts, run this in Supabase SQL Editor:

```sql
-- Should show 4 accounts with correct roles
SELECT email, role FROM profiles 
WHERE email LIKE '%test.com%' 
ORDER BY role;
```

Expected output:
```
admin@test.com     | admin
staff@test.com     | staff
student@test.com   | student
teacher@test.com   | teacher
```

---

## 🚀 What's Already Done

✅ Code implementation complete
✅ TypeScript types updated
✅ Permission system implemented
✅ Sidebar navigation updated
✅ API routes updated
✅ Migration files created
✅ Test scripts created
✅ Documentation complete

**Only database steps remain!**

---

## 🐛 Issues?

### Migration failed with "already exists"
- This is OK! The migration is idempotent
- Just verify the role constraint was updated

### Accounts not appearing
- Make sure you auto-confirmed email when creating users
- Check they exist: `SELECT email FROM profiles WHERE email LIKE '%test.com%';`

### Sidebar still shows old sections
- Hard refresh: `Ctrl+Shift+R`
- Log out and back in
- Check user role in database

### Still have issues?
See `docs/SETUP_4ROLE_SYSTEM.md` → Troubleshooting section

---

## 📞 Files to Reference

```
📁 supabase/
└─ migrations/
   └─ 20241209_add_staff_role_complete.sql ← Run this in Supabase

📁 docs/
├─ SETUP_4ROLE_SYSTEM.md ← Full step-by-step guide
├─ ROLE_BASED_ACCESS_MATRIX.md ← Permission matrix
├─ IMPLEMENTATION_CHECKLIST.md ← What's done/pending
└─ IMPLEMENTATION_COMPLETE_SUMMARY.md ← Technical details

📁 scripts/
├─ create-4role-test-users.ts ← TypeScript version
└─ setup-4role-system.js ← Node version
```

---

## ✨ Success Indicator

You'll know it's working when:
1. ✅ Migration runs without errors
2. ✅ 4 test accounts created in Auth > Users
3. ✅ Profiles have correct roles
4. ✅ Can login with each account
5. ✅ Each account shows different sidebar
6. ✅ Can access appropriate pages per role

---

## 🎉 Done!

That's it! You've successfully set up the 4-role system.

**Next**: Create real users with appropriate roles and start using the system!

---

**Questions?** Check the documentation files above or see the full guide in `docs/SETUP_4ROLE_SYSTEM.md`
