# 🔍 SQL Files Audit & Consolidation Plan
**Date**: November 22, 2025  
**Purpose**: Identify redundant SQL files and create a single source of truth

---

## 📊 Current State

### **Root Level (supabase/)**
1. ✅ **COMPLETE_STUDENT_MANAGEMENT.sql** (937 lines) - **PRIMARY FILE**
   - Contains: All tables, RLS policies, helper functions
   - Status: **KEEP - This is our single source of truth**
   
2. ✅ **COMPLETE_TEST_SEED.sql**
   - Contains: Reference data (academic_years, grading_scales, payment_methods, fee_types)
   - Status: **KEEP - Run after schema**
   
3. ✅ **ADD_INSERT_POLICIES.sql** (NEW, 33 lines)
   - Contains: Temporary fix for INSERT policies
   - Status: **MERGE into COMPLETE_STUDENT_MANAGEMENT.sql, then DELETE**
   
4. ⚠️ **APPLY_CLEAN_STUDENT_MIGRATION.sql**
   - Contains: Older version of schema
   - Status: **DELETE - Superseded by COMPLETE_STUDENT_MANAGEMENT.sql**
   
5. ⚠️ **APPLY_STUDENT_MIGRATIONS.sql**
   - Contains: Wrapper to apply multiple migrations
   - Status: **DELETE - No longer needed**
   
6. ⚠️ **DISABLE_RLS_FOR_SEEDING.sql** (NEW)
   - Contains: Temporary RLS disable
   - Status: **DELETE - We'll use INSERT policies instead**
   
7. ⚠️ **ENABLE_RLS_AFTER_SEEDING.sql** (NEW)
   - Contains: Re-enable RLS
   - Status: **DELETE - We'll use INSERT policies instead**
   
8. ⚠️ **VERIFY_MIGRATION.sql**
   - Contains: Verification queries
   - Status: **KEEP for debugging, but document as optional**

---

### **migrations/ Folder (50+ files)**
All these are **OBSOLETE** - they were incremental migrations that are now merged into `COMPLETE_STUDENT_MANAGEMENT.sql`

#### Schema Migrations (001-044)
- ❌ 001_schema.sql → Merged
- ❌ 002_rls_policies.sql → Merged
- ❌ 003_rpc_get_student_metrics.sql → Merged
- ❌ 004-008, 010-046 → All merged into COMPLETE_STUDENT_MANAGEMENT.sql

#### Status: **ARCHIVE or DELETE entire migrations/ folder**

---

### **seed/ Folder**
1. ✅ **01_reference_data.sql**
   - Contains: Same data as COMPLETE_TEST_SEED.sql
   - Status: **DELETE - Duplicate of COMPLETE_TEST_SEED.sql**
   
2. ⚠️ **02_cleanup.sql**
   - Contains: Cleanup queries
   - Status: **REVIEW and DELETE if not needed**

---

## 🎯 Consolidation Plan

### Phase 1: Merge INSERT Policies into Main Schema
Update `COMPLETE_STUDENT_MANAGEMENT.sql` to include INSERT policies from `ADD_INSERT_POLICIES.sql`

### Phase 2: Create Clean Structure
```
supabase/
├── COMPLETE_STUDENT_MANAGEMENT.sql  ← Single source of truth (schema + RLS + functions)
├── COMPLETE_TEST_SEED.sql           ← Reference data only
├── VERIFY_MIGRATION.sql             ← Optional: For debugging
└── migrations/                      ← Archive or delete entire folder
    └── ARCHIVED_README.md           ← Explain why these are archived
```

### Phase 3: Delete Obsolete Files
- DELETE: ADD_INSERT_POLICIES.sql (after merging)
- DELETE: APPLY_CLEAN_STUDENT_MIGRATION.sql
- DELETE: APPLY_STUDENT_MIGRATIONS.sql
- DELETE: DISABLE_RLS_FOR_SEEDING.sql
- DELETE: ENABLE_RLS_AFTER_SEEDING.sql
- DELETE: seed/01_reference_data.sql (duplicate)
- DELETE: seed/02_cleanup.sql (if not needed)
- ARCHIVE: migrations/* (all 50+ files)

---

## ✅ Final File Structure

### **What to Keep**
1. **COMPLETE_STUDENT_MANAGEMENT.sql** - Complete schema with INSERT policies
2. **COMPLETE_TEST_SEED.sql** - Reference data seeding
3. **VERIFY_MIGRATION.sql** (optional) - Debugging queries

### **What to Archive**
- Move `migrations/` to `migrations_archived/` with a README explaining they're superseded

### **What to Delete**
- All temporary fix files (ADD_INSERT_POLICIES, DISABLE_RLS, ENABLE_RLS, APPLY_*)
- Duplicate seed files

---

## 🔧 Implementation Steps

1. ✅ Merge INSERT policies into COMPLETE_STUDENT_MANAGEMENT.sql
2. ✅ Test the merged file applies correctly
3. ✅ Create migrations_archived/ folder with README
4. ✅ Move migrations/* to migrations_archived/*
5. ✅ Delete temporary files
6. ✅ Update DEPLOYMENT_GUIDE.md with new file structure

---

## 📝 Migration Instructions (New)

**For fresh database setup:**
```sql
-- Step 1: Apply complete schema
-- Run: supabase/COMPLETE_STUDENT_MANAGEMENT.sql

-- Step 2: Seed reference data
-- Run: supabase/COMPLETE_TEST_SEED.sql

-- Step 3: Seed test users
-- Run: npx tsx web/scripts/seed.ts
```

**For existing databases:**
- If you already applied migrations 001-046, you're good!
- If starting fresh, just use COMPLETE_STUDENT_MANAGEMENT.sql

---

## ⚠️ Important Notes

1. **Never apply incremental migrations after using COMPLETE_STUDENT_MANAGEMENT.sql**
2. **COMPLETE_STUDENT_MANAGEMENT.sql uses DROP TABLE CASCADE** - It's destructive!
3. **Always backup before applying schema**
4. **The service role key bypasses RLS**, so INSERT policies are just for clarity

---

**Ready to proceed with consolidation?**
