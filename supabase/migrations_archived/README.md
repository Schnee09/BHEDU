# 📦 Archived Migrations

**Status**: These migration files are **ARCHIVED** and should **NOT** be applied.

## Why Archived?

All 50+ incremental migration files (001-046) have been **consolidated** into a single source of truth:

👉 **`../COMPLETE_STUDENT_MANAGEMENT.sql`**

## What's in This Folder?

Historical migration files that were created during development:
- Schema migrations (001-044)
- RLS policy fixes (040-043)
- Vietnamese grade system (20251119)
- Student management functions (044-046)
- And many more...

## ⚠️ Important Notes

1. **DO NOT apply these migrations** if you're starting fresh
2. **Use `COMPLETE_STUDENT_MANAGEMENT.sql` instead** - it contains everything
3. These files are kept for **historical reference only**
4. If you already applied migrations 001-046, you're fine - don't reapply anything

## 🚀 For New Deployments

Follow this sequence instead:

```sql
-- Step 1: Apply complete schema (DROP TABLE CASCADE - destructive!)
-- File: supabase/COMPLETE_STUDENT_MANAGEMENT.sql

-- Step 2: Seed reference data
-- File: supabase/COMPLETE_TEST_SEED.sql

-- Step 3: Create test users and sample data
-- Run: npx tsx web/scripts/seed.ts
```

## 📚 What Changed?

The consolidation process:
- ✅ Merged all schema definitions
- ✅ Merged all RLS policies
- ✅ Added INSERT policies for service role
- ✅ Merged all helper functions
- ✅ Fixed circular RLS dependencies
- ✅ Removed redundant policies

## 🔍 If You Need to Reference Old Migrations

You can find specific changes by:
1. Searching this folder for table names
2. Using `git log` to see when changes were made
3. Comparing with `COMPLETE_STUDENT_MANAGEMENT.sql`

---

**Last Updated**: November 22, 2025  
**Reason**: Consolidated 50+ migrations into single source of truth
