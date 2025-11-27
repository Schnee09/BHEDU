# 🚀 Quick Start Guide - Clean Setup

## Current State
Your project has conflicting migration files and seed data. This guide provides a clean path forward.

## ✅ Automated Setup (Recommended)

### Option 1: Use Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard → SQL Editor
2. Copy and paste `COMPLETE_STUDENT_MANAGEMENT.sql` → Run
3. Copy and paste `COMPLETE_TEST_SEED.sql` → Run
4. Run auth seed script (see step 4 below)

### Option 2: Use Batch Script (Windows)
```cmd
cd supabase
set SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
apply-clean-setup.bat
```

## 📋 Manual Step-by-Step

### 1. Apply Schema
From the `supabase` folder:
```cmd
REM Via Supabase CLI (if configured)
type COMPLETE_STUDENT_MANAGEMENT.sql | supabase db execute

REM OR manually copy-paste into Supabase Dashboard SQL Editor
```

### 2. Seed Reference Data
```cmd
type COMPLETE_TEST_SEED.sql | supabase db execute

REM OR manually copy-paste into Supabase Dashboard SQL Editor
```

### 3. Verify Schema
From the project root:
```cmd
node web\scripts\health-check.js
```

### 4. Create Auth Users
```cmd
REM Option A: Backend script
node backend\seed_supabase_auth.js

REM Option B: Web script
cd web
pnpm tsx scripts\seed.ts
```

### 5. Test API
```cmd
cd web\scripts
.\test-all-apis.ps1
```

## 🗂️ File Organization

### Keep These Files
- ✅ `COMPLETE_STUDENT_MANAGEMENT.sql` - Complete schema, RLS, functions
- ✅ `COMPLETE_TEST_SEED.sql` - Reference data seed
- ✅ `README_RECOVERY.md` - Recovery guide
- ✅ `apply-clean-setup.bat` - Automated setup script

### Archive/Ignore These
- 📦 `migrations/*` - Old incremental migrations (kept for reference)
- 📦 `seed/01_reference_data.sql` - Merged into COMPLETE_TEST_SEED.sql
- 📦 `seed/02_cleanup.sql` - No longer needed
- 📦 `APPLY_*.sql` - Outdated migration files
- 📦 `VERIFY_MIGRATION.sql` - No longer needed

## 🔧 Troubleshooting

### "Table does not exist"
→ Apply `COMPLETE_STUDENT_MANAGEMENT.sql` first

### "Permission denied" / RLS errors
→ Check that you're using the correct auth token
→ Verify RLS policies are applied (included in schema file)

### "Auth users not created"
→ SQL cannot create auth users - must use Node/TS scripts

### CLI commands fail
→ Use Supabase Dashboard SQL Editor instead
→ Or check your `SUPABASE_DB_URL` and credentials

## 📞 Next Steps After Setup

1. ✅ Run health check: `node web\scripts\health-check.js`
2. ✅ Test student CRUD via API or dashboard
3. ✅ Verify RLS by testing as different user roles
4. ✅ Check enrollment and attendance features
5. ✅ Archive old migration files to `supabase/archive/`

---

**Questions? Check `README_RECOVERY.md` for more details.**
