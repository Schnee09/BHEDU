# Supabase Configuration & Database Setup# 🗄️ BH-EDU Supabase Database



This directory contains all Supabase-related configuration and database scripts.**Single Source of Truth**: `COMPLETE_STUDENT_MANAGEMENT.sql`



## 🚀 Quick Setup---



### 1. Run Database Setup (ONE FILE ONLY)## 📁 Files in This Folder



```sql### ✅ Active Files (Use These)

-- Run this in Supabase SQL Editor

-- File: NUCLEAR_FIX_COMPLETE_REBUILD.sql1. **COMPLETE_STUDENT_MANAGEMENT.sql** (951 lines)

```   - Complete database schema

   - All tables (20+)

This is the **ONLY** SQL file you need to run. It includes:   - RLS policies (with INSERT policies)

- ✅ All table schemas with correct columns   - Helper functions

- ✅ All 5 RPC functions (attendance, grades, QR codes)   - 🎯 **Apply this first for fresh database**

- ✅ Performance indexes

- ✅ Default constraints2. **COMPLETE_TEST_SEED.sql**

- ✅ Data validation   - Reference data seeding

   - Academic years, grading scales, payment methods, fee types

## 📁 Directory Structure   - 🎯 **Run after schema**



```3. **VERIFY_MIGRATION.sql**

supabase/   - Verification queries

├── NUCLEAR_FIX_COMPLETE_REBUILD.sql  # ⭐ THE ONE TRUE FIX   - Use for debugging

├── README.md                          # This file   - 🔧 **Optional**

├── config.toml                        # Supabase CLI config

├── functions/                         # Edge Functions### 📚 Documentation

├── migrations_archived/               # Old migrations (archived)

└── _obsolete/                         # Old SQL attempts (ignore)- **SQL_FILES_AUDIT.md** - Complete audit of all SQL files

```- **CONSOLIDATION_COMPLETE.md** - Consolidation summary

- **QUICK_MIGRATION_GUIDE.md** - Quick reference

## 🗄️ Database Schema

### 📦 Archived/Obsolete

### Main Tables

- **profiles** - User profiles (students, teachers, admins)- **migrations_archived/** - Historical migrations (50+ files, don't use)

- **classes** - Academic classes- **_obsolete/** - Superseded files (safe to delete after testing)

- **subjects** - Course subjects- **archive/** - Old archive folder

- **enrollments** - Student-class relationships

- **attendance** - Attendance records---

- **assignments** - Homework/tasks

- **grades** - Student grades## 🚀 Quick Start

- **academic_years** - School years

- **fee_types** - Fee categories### Fresh Database Setup

- **payments** - Payment records

- **invoices** - Invoices```bash

- **qr_codes** - QR attendance codes# 1. Go to Supabase Dashboard

#    https://supabase.com/dashboard/project/YOUR_PROJECT/editor

### RPC Functions

1. **get_user_statistics()** - Dashboard stats# 2. Open SQL Editor

2. **get_class_attendance(class_id, date)** - Attendance for a class

3. **calculate_overall_grade(student_id, class_id)** - Grade calculations# 3. Copy and paste COMPLETE_STUDENT_MANAGEMENT.sql

4. **generate_qr_code(class_id, valid_minutes)** - Generate QR for attendance#    Click "Run"

5. **check_in_with_qr(token, student_id)** - Check-in via QR code

# 4. Copy and paste COMPLETE_TEST_SEED.sql  

## ⚙️ Configuration#    Click "Run"



### Required Environment Variables# 5. Run seed script from web folder

```envcd ../web

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.conpx tsx scripts/seed.ts

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key```

SUPABASE_SERVICE_ROLE_KEY=your_service_key

```### Verify Setup



Get these from: Supabase Dashboard → Settings → API```bash

# Go back to Supabase Dashboard → SQL Editor

## 🔧 Supabase CLI (Optional)# Copy and paste VERIFY_MIGRATION.sql

# Click "Run"

### Install# Should show all tables exist

```bash```

npm install -g supabase

```---



### Link Project## ⚠️ Important Notes

```bash

supabase link --project-ref your-project-ref1. **COMPLETE_STUDENT_MANAGEMENT.sql uses DROP TABLE CASCADE**

```   - It's destructive! Backup before applying

   - Only use on fresh database or when you want to reset

### Generate Types

```bash2. **Don't apply migrations_archived/ files**

supabase gen types typescript --project-id your-project-id > web/lib/supabase/database.types.ts   - They're historical only

```   - Everything is in COMPLETE_STUDENT_MANAGEMENT.sql



## 📝 Notes3. **Service Role Key Required**

   - For seeding scripts

### Important   - Add to `web/.env` file

- ⚠️ **DO NOT** run SQL files from `_obsolete/` folder   - Never commit to git!

- ⚠️ **DO NOT** run files from `migrations_archived/`

- ✅ **ONLY** run `NUCLEAR_FIX_COMPLETE_REBUILD.sql`---



### Safety## 📊 What's Inside COMPLETE_STUDENT_MANAGEMENT.sql

- The main SQL file uses `IF NOT EXISTS` - safe to run multiple times

- All data is preserved### Tables (20+)

- No destructive operations- profiles, classes, enrollments, guardians

- attendance, qr_codes, attendance_reports

### Troubleshooting- subjects, courses, lessons

- If SQL fails, check Supabase logs- assignments, assignment_categories, grades

- Verify no syntax errors (red highlights)- notifications, school_settings

- Can safely re-run the SQL if needed- audit_logs, import_logs, import_errors

- academic_years, grading_scales, payment_methods, fee_types

## 🆘 Help

### RLS Policies

- **Setup Issues**: See main `START_HERE.md`- SELECT policies for users to read their own data

- **Database Errors**: Check `docs/TROUBLESHOOTING.md`- INSERT policies for service role (seeding)

- **API Issues**: See `docs/API_DOCS.md`- UPDATE policies for profile owners

- Admin full access policies

---

### Helper Functions

**Remember**: You only need to run `NUCLEAR_FIX_COMPLETE_REBUILD.sql` once!- `is_admin()`, `is_teacher()`, `is_student()`

- `is_enrolled_in_class()`
- `batch_insert_enrollments()`
- `get_student_with_enrollments()`
- And more...

---

## 🗑️ Cleanup (Optional)

After confirming everything works:

```bash
# Remove obsolete files
Remove-Item -Recurse -Force _obsolete/

# Remove archived migrations (or keep for history)
# Remove-Item -Recurse -Force migrations_archived/

# Remove empty seed folder
Remove-Item -Recurse -Force seed/

# Remove old archive folder
Remove-Item -Recurse -Force archive/
```

---

## 🔧 Troubleshooting

### "Permission denied for schema public"
→ Make sure you applied COMPLETE_STUDENT_MANAGEMENT.sql first (includes INSERT policies)

### "Table does not exist"
→ Apply COMPLETE_STUDENT_MANAGEMENT.sql in Supabase Dashboard SQL Editor

### "RLS policies blocking access"
→ Check if user has correct role (admin/teacher/student)

### Seed script fails
→ Make sure `.env` file has correct SUPABASE_SERVICE_ROLE_KEY

---

**Need help?** Check `../PROJECT_STRUCTURE.md` for complete project documentation.
