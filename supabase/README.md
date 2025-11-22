# 🗄️ BH-EDU Supabase Database

**Single Source of Truth**: `COMPLETE_STUDENT_MANAGEMENT.sql`

---

## 📁 Files in This Folder

### ✅ Active Files (Use These)

1. **COMPLETE_STUDENT_MANAGEMENT.sql** (951 lines)
   - Complete database schema
   - All tables (20+)
   - RLS policies (with INSERT policies)
   - Helper functions
   - 🎯 **Apply this first for fresh database**

2. **COMPLETE_TEST_SEED.sql**
   - Reference data seeding
   - Academic years, grading scales, payment methods, fee types
   - 🎯 **Run after schema**

3. **VERIFY_MIGRATION.sql**
   - Verification queries
   - Use for debugging
   - 🔧 **Optional**

### 📚 Documentation

- **SQL_FILES_AUDIT.md** - Complete audit of all SQL files
- **CONSOLIDATION_COMPLETE.md** - Consolidation summary
- **QUICK_MIGRATION_GUIDE.md** - Quick reference

### 📦 Archived/Obsolete

- **migrations_archived/** - Historical migrations (50+ files, don't use)
- **_obsolete/** - Superseded files (safe to delete after testing)
- **archive/** - Old archive folder

---

## 🚀 Quick Start

### Fresh Database Setup

```bash
# 1. Go to Supabase Dashboard
#    https://supabase.com/dashboard/project/YOUR_PROJECT/editor

# 2. Open SQL Editor

# 3. Copy and paste COMPLETE_STUDENT_MANAGEMENT.sql
#    Click "Run"

# 4. Copy and paste COMPLETE_TEST_SEED.sql  
#    Click "Run"

# 5. Run seed script from web folder
cd ../web
npx tsx scripts/seed.ts
```

### Verify Setup

```bash
# Go back to Supabase Dashboard → SQL Editor
# Copy and paste VERIFY_MIGRATION.sql
# Click "Run"
# Should show all tables exist
```

---

## ⚠️ Important Notes

1. **COMPLETE_STUDENT_MANAGEMENT.sql uses DROP TABLE CASCADE**
   - It's destructive! Backup before applying
   - Only use on fresh database or when you want to reset

2. **Don't apply migrations_archived/ files**
   - They're historical only
   - Everything is in COMPLETE_STUDENT_MANAGEMENT.sql

3. **Service Role Key Required**
   - For seeding scripts
   - Add to `web/.env` file
   - Never commit to git!

---

## 📊 What's Inside COMPLETE_STUDENT_MANAGEMENT.sql

### Tables (20+)
- profiles, classes, enrollments, guardians
- attendance, qr_codes, attendance_reports
- subjects, courses, lessons
- assignments, assignment_categories, grades
- notifications, school_settings
- audit_logs, import_logs, import_errors
- academic_years, grading_scales, payment_methods, fee_types

### RLS Policies
- SELECT policies for users to read their own data
- INSERT policies for service role (seeding)
- UPDATE policies for profile owners
- Admin full access policies

### Helper Functions
- `is_admin()`, `is_teacher()`, `is_student()`
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
