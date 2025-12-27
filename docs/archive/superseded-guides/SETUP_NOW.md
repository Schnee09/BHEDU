# ✅ EXECUTE NOW: 5-Minute Setup

## What Has Been Done ✅

- ✅ **3 of 4 test accounts created** (admin, teacher, student)
- ⏳ **1 account pending** (staff - waiting for database constraint)
- ✅ **All code deployed** (sidebar, permissions, types)
- ⏳ **Database constraint pending** (just one SQL command needed)

---

## 🎯 What You Need To Do (5 minutes)

### Step 1: Copy & Run One SQL Command (2 minutes)

**Go to:** https://supabase.com/dashboard

**Then:**
1. Select your project → `BH-EDU`
2. Left side → **SQL Editor** → **New Query**
3. **Copy this SQL** (below) and paste it in the editor
4. Click **RUN**

```sql
-- Add 'staff' role to database
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);
```

**That's it!** ✨

---

### Step 2: Re-run Account Setup Script (2 minutes)

Once the SQL above is done, run:

```bash
node scripts\setup-4role-commonjs.js
```

This will:
- Verify all 4 accounts ✅
- Create the staff account that was pending
- Display all credentials

---

### Step 3: Test in Browser (1 minute)

**Start dev server** (if not running):
```bash
cd web
npm run dev
```

**Visit:** http://localhost:3000/login

**Try these logins:**
```
Email: admin@test.com
Password: test123
```

**Expected result:**
- Dashboard loads
- Sidebar shows 8 sections (full menu)
- Try other accounts to see different sidebars

---

## 📊 Current Status

| Item | Status | What's Left |
|------|--------|-------------|
| Code | ✅ Done | Nothing |
| Types | ✅ Done | Nothing |
| Permissions | ✅ Done | Nothing |
| Sidebar | ✅ Done | Nothing |
| **Database Constraint** | ⏳ Ready | **Paste SQL above** |
| **Test Accounts** | ✅ 75% | **Re-run script after SQL** |
| Login Test | ⏳ Ready | Try it after accounts done |

---

## 🚀 Quick Command Cheatsheet

**Run migration (1 copy-paste in Supabase):**
```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);
```

**Create/verify accounts (run in terminal):**
```bash
node scripts\setup-4role-commonjs.js
```

**Start dev server:**
```bash
cd web && npm run dev
```

---

## 📋 Summary

- **3 accounts created** ✅
- **1 account ready** ⏳ (just needs DB constraint)
- **Migration ready** ✅ (2-line SQL command)
- **Code complete** ✅ (no more coding needed)

**Everything is ready to go!** Just need to run that one SQL command in Supabase.

---

## ❓ FAQ

**Q: What if I get an error running the SQL?**  
A: It's probably fine! The error "constraint already exists" means it's already done. Just move forward.

**Q: The staff account still doesn't work?**  
A: Make sure you ran the SQL command in Supabase first. That adds the staff role to the database.

**Q: Can I test without running the migration?**  
A: Sure! Admin, teacher, and student accounts are ready now. Just can't use the staff account yet.

**Q: Do I need to restart the dev server?**  
A: Only if it was running while you made database changes. A refresh usually works.

---

## 🎉 After This Step

You'll have:
- ✅ 4 working test accounts
- ✅ Role-based sidebar (different for each role)
- ✅ Permission system enforced
- ✅ Complete 4-role implementation

**Total time:** ~5 minutes  
**Complexity:** Copy-paste one SQL command + run one script
