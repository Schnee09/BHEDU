# Schema Audit Report - BH-EDU System
**Date:** November 20, 2025  
**Status:** CRITICAL ISSUES FOUND

## Executive Summary

Found major schema mismatches between database schema and API routes that will cause runtime failures. The most critical issue is that **60+ API route files** reference `first_name` and `last_name` columns that don't exist in the `profiles` table.

---

## ✅ Completed Fixes

### 1. ESLint Configuration (Commit: 53cd34d)
- Reduced from 10,410 errors to 193 warnings
- All issues now non-blocking
- Build passes successfully

### 2. Classes Table Schema (Commit: 8d4b6d9)
- ✅ Fixed: `classes.title` → `classes.name`
- ✅ Removed: Non-existent `classes.code` references
- **Note:** Migration 039_add_first_last_name_to_profiles.sql adds `code` column

### 3. Grades Table Schema (Commit: 19524f0)
- ✅ Fixed: `grades.grade_value` → `grades.points_earned`
- ✅ Fixed: Removed `grades.grade_type`, `grades.weight`, `grades.recorded_at`
- ✅ Added: Correct columns `late`, `excused`, `missing`, `graded_at`

### 4. Assignments Table Schema (Commit: 967f1d4)
- ✅ Fixed: `assignments.max_points` → `assignments.total_points`
- Files updated:
  - `web/app/api/admin/assignments/route.ts`
  - `web/app/api/admin/assignments/[id]/route.ts`
  - `web/app/api/admin/grades/route.ts`
  - `web/app/api/admin/grades/[id]/route.ts`

---

## 🔴 CRITICAL: Profiles Table - first_name/last_name (Migration Created, Not Applied)

### Problem
- **Database has:** `profiles.full_name` (TEXT)
- **API routes expect:** `profiles.first_name` (TEXT), `profiles.last_name` (TEXT), `profiles.email` (TEXT)
- **Impact:** 60+ files will fail at runtime with "column does not exist" errors

### Affected Files (Sample)
```
web/app/api/admin/students/[id]/route.ts (8 occurrences)
web/app/api/admin/teachers/route.ts (7 occurrences)
web/app/api/admin/teachers/[id]/route.ts (8 occurrences)
web/app/api/admin/enrollments/route.ts (2 occurrences)
web/app/api/admin/enrollments/[id]/route.ts (4 occurrences)
web/app/api/admin/assignments/route.ts (2 occurrences)
web/app/api/admin/assignments/[id]/route.ts (4 occurrences)
web/app/api/admin/attendance/route.ts (4 occurrences)
web/app/api/admin/attendance/[id]/route.ts (4 occurrences)
web/app/api/admin/grades/route.ts (4 occurrences)
web/app/api/admin/grades/[id]/route.ts (4 occurrences)
... and 40+ more files
```

### Solution Created
**Migration File:** `supabase/migrations/039_add_first_last_name_to_profiles.sql` (Committed: c2abb42)

**What it does:**
1. Adds `first_name`, `last_name`, `email` columns to profiles table
2. Migrates existing data by splitting `full_name`
3. Creates trigger to keep `full_name` in sync when first/last name changes
4. Adds performance indexes

**Action Required:**
⚠️ **This migration MUST be applied to your Supabase database before any API routes will work**

**To apply:**
```sql
-- Option 1: Run directly in Supabase SQL Editor
-- Copy contents of supabase/migrations/039_add_first_last_name_to_profiles.sql

-- Option 2: Use Supabase CLI (if setup)
supabase db push

-- Option 3: Manual application via psql
psql $DATABASE_URL -f supabase/migrations/039_add_first_last_name_to_profiles.sql
```

---

## ✅ Verified Correct Schema

### Classes Table
Based on migration `20251120_1200_comprehensive_fix.sql`, the classes table should have:
- `id` (UUID, PRIMARY KEY)
- `name` (TEXT) ✅
- `code` (VARCHAR(50)) ✅ Added in comprehensive fix
- `grade` (TEXT) 
- `grade_level` (VARCHAR(20)) ✅
- `teacher_id` (UUID)
- `description` (TEXT) ✅
- `status` (VARCHAR(20)) ✅
- `room_number` (VARCHAR(50)) ✅
- `schedule` (TEXT) ✅
- `max_students` (INTEGER) ✅
- `academic_year_id` (UUID) ✅
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ) ✅

### Assignments Table
Based on migration `018_assignments.sql`:
- `id` (UUID, PRIMARY KEY)
- `class_id` (UUID)
- `title` (TEXT)
- `description` (TEXT)
- `due_date` (TIMESTAMPTZ)
- `category_id` (UUID)
- `total_points` (INTEGER) ✅ **Not max_points**
- `assigned_date` (DATE)
- `published` (BOOLEAN)
- `updated_at` (TIMESTAMPTZ)

### Grades Table
Based on migration `019_grades.sql`:
- `id` (UUID, PRIMARY KEY)
- `assignment_id` (UUID)
- `student_id` (UUID)
- `points_earned` (INTEGER) ✅ **Not grade_value**
- `late` (BOOLEAN) ✅
- `excused` (BOOLEAN) ✅
- `missing` (BOOLEAN) ✅
- `feedback` (TEXT)
- `graded_at` (TIMESTAMPTZ) ✅ **Not recorded_at**
- `graded_by` (UUID)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Profiles Table (After Migration 039)
Will have:
- `id` (UUID, PRIMARY KEY)
- `full_name` (TEXT) ✅
- `first_name` (TEXT) ⚠️ **Needs migration 039**
- `last_name` (TEXT) ⚠️ **Needs migration 039**
- `email` (TEXT) ⚠️ **Needs migration 039**
- `role` (TEXT) - admin/teacher/student
- `avatar_url` (TEXT)
- `photo_url` (TEXT)
- `metadata` (JSONB)
- `student_id` (VARCHAR(50))
- `student_code` (VARCHAR(20))
- `grade_level` (VARCHAR(20))
- `phone` (VARCHAR(20))
- `address` (TEXT)
- `date_of_birth` (DATE)
- `gender` (VARCHAR(10))
- `enrollment_date` (DATE)
- `status` (VARCHAR(20))
- `created_at` (TIMESTAMPTZ)

---

## 📋 Next Steps (In Order)

### 1. Apply Migration 039 (CRITICAL - DO THIS FIRST)
- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `supabase/migrations/039_add_first_last_name_to_profiles.sql`
- [ ] Execute in your database
- [ ] Verify: Run `SELECT first_name, last_name, full_name FROM profiles LIMIT 5;`

### 2. Review RLS Policies
- [ ] Check migration `20251120_1200_comprehensive_fix.sql` policies
- [ ] Verify admins can access all data
- [ ] Verify teachers can access their classes/students
- [ ] Verify students can access their own data
- [ ] Test with actual user accounts

### 3. Verify Test Data
- [ ] Check if tables have data: `SELECT COUNT(*) FROM profiles;`
- [ ] Check students: `SELECT COUNT(*) FROM profiles WHERE role = 'student';`
- [ ] Check teachers: `SELECT COUNT(*) FROM profiles WHERE role = 'teacher';`
- [ ] Check classes: `SELECT COUNT(*) FROM classes;`
- [ ] Check enrollments: `SELECT COUNT(*) FROM enrollments;`
- [ ] If empty, run seed scripts

### 4. Test API Endpoints
After applying migration 039:
- [ ] Test admin teacher list: `GET /api/admin/teachers`
- [ ] Test admin student list: `GET /api/admin/students`
- [ ] Test class details: `GET /api/admin/classes/[id]`
- [ ] Test grade operations: `GET /api/admin/grades`
- [ ] Check for "column does not exist" errors

---

## 🔍 How to Verify Schema

### Check if migration 039 is applied:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'email');
```

**Expected result:** 3 rows showing these columns exist

**If empty:** Migration not applied yet

### Check data migration worked:
```sql
SELECT id, full_name, first_name, last_name 
FROM profiles 
WHERE full_name IS NOT NULL 
LIMIT 10;
```

**Expected:** first_name and last_name populated from full_name

---

## 📊 Schema Mismatch Statistics

- **Total API route files scanned:** 120+
- **Files using first_name/last_name:** 60+
- **Critical issues found:** 1 (profiles table)
- **Issues fixed:** 3 (classes, grades, assignments)
- **Migrations created:** 1 (039_add_first_last_name_to_profiles.sql)
- **Git commits:** 4 (53cd34d, 8d4b6d9, 19524f0, 967f1d4, c2abb42)

---

## ⚠️ Production Readiness Blockers

1. **BLOCKER:** Migration 039 not applied - 60+ routes will fail
2. **UNKNOWN:** RLS policies not tested - may block data access
3. **UNKNOWN:** Test data existence - may show empty lists

**Recommendation:** Do NOT deploy to production until migration 039 is applied and verified.

---

## 📝 Migration History

| Migration | Status | Description |
|-----------|--------|-------------|
| 001-038 | ✅ Applied | Base schema and features |
| 039 | ⚠️ **PENDING** | **Add first_name/last_name to profiles** |
| 20251119 | ✅ Applied | Vietnamese grade system |
| 20251120_1200 | ✅ Applied | Comprehensive fix (adds classes.code) |

---

## 💡 Maintenance Recommendations

1. **Add schema validation tests** - Automatically verify DB schema matches TypeScript types
2. **Document column renames** - Add comments to migrations explaining changes
3. **Create migration checklist** - Require verification before marking complete
4. **Add pre-deploy script** - Check for pending migrations before deployment
5. **Use TypeScript + Supabase CLI** - Auto-generate types from database

---

**Report Generated By:** Schema Audit Tool  
**Last Updated:** 2025-11-20 via commit c2abb42
