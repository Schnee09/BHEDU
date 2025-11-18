# Schema Fix Summary: full_name Migration

## Overview
Fixed a critical and widespread schema mismatch where API routes were querying `first_name` and `last_name` columns, but the `profiles` table only has a `full_name` column (as defined in the original `001_schema.sql` migration).

## Root Cause
- **Database Schema**: The `profiles` table has always had `full_name` (not `first_name`/`last_name`)
- **API Routes**: Many routes incorrectly assumed split name fields
- **Impact**: 500 errors across user management, attendance, grades, finance, and student management APIs

## Files Fixed

### User Management (Commit 1: ce94ea5)
1. **web/app/api/admin/users/route.ts**
   - GET: Changed select and search filter to `full_name`
   - POST: Changed body destructure, validation, createUser, and email generation to `full_name`

2. **web/app/api/admin/users/[id]/route.ts**
   - GET: Changed select to `full_name`
   - PUT: Changed body and profile update to `full_name`

3. **web/app/api/admin/users/[id]/reset-password/route.ts**
   - Changed select and email parameter to `full_name`

4. **web/app/api/admin/users/import/route.ts**
   - Updated `UserImportRow` interface to use `full_name`
   - Changed validation, createUser, and profileData to `full_name`

### Student, Attendance, Grades, Finance (Commit 2: 6bd1842)
5. **web/app/api/admin/students/import/route.ts**
   - Changed `user_metadata` to: `full_name: \`${student.firstName} ${student.lastName}\`.trim()`
   - Changed profile insert to `full_name`

6. **web/app/api/admin/students/import/history/route.ts**
   - Removed `first_name, last_name` from importer profile select
   - Now selects: `id, full_name, email`

7. **web/app/api/classes/[classId]/students/route.ts**
   - Changed student profile select to `full_name`

8. **web/app/api/attendance/reports/route.ts**
   - Changed student profile select to `full_name`
   - Changed name concatenation from `\`${first_name} ${last_name}\`` to direct `full_name` usage

9. **web/app/api/grades/route.ts**
   - Changed student profile select to `full_name`

10. **web/app/api/grades/student-overview/route.ts**
    - Changed profile select to `full_name`

11. **web/app/api/admin/finance/student-accounts/route.ts**
    - Changed student profile select in GET and POST to `full_name` (removed `first_name, last_name`)

12. **web/app/api/admin/finance/invoices/route.ts**
    - Changed student profile select in GET query and POST fetch to `full_name`

13. **web/app/api/admin/finance/payments/route.ts**
    - Changed student profile select in GET query to `full_name`
    - Changed received_by_user profile select to `full_name`
    - Changed POST fetch to use `full_name`

## Database Schema Reference
From `supabase/migrations/001_schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email varchar(255) NOT NULL UNIQUE,
  full_name varchar(255),  -- ← Single name field
  role user_role DEFAULT 'student',
  ...
);
```

## Testing Checklist
After Vercel deployment completes:

### Admin Users Page ✅
- [x] Schema fixes deployed (both commits)
- [ ] Login with admin account
- [ ] Navigate to `/dashboard/users`
- [ ] Verify user list loads without 500 error
- [ ] Test search/filter functionality
- [ ] Test creating a new user
- [ ] Test editing an existing user
- [ ] Verify all name fields display correctly

### Student Management
- [ ] Navigate to `/dashboard/students/import`
- [ ] Test student import with CSV containing firstName/lastName
- [ ] Verify import history shows correct names
- [ ] Check that student profiles display full_name correctly

### Attendance
- [ ] Navigate to `/dashboard/attendance/reports`
- [ ] Verify reports load without 500 errors
- [ ] Check that student names display correctly in reports
- [ ] Test filtering by class, student, date range

### Grades
- [ ] Navigate to `/dashboard/grades/entry`
- [ ] Verify grade entry page loads student names
- [ ] Navigate to `/dashboard/grades/reports`
- [ ] Check student names in grade reports
- [ ] Test student overview page

### Finance
- [ ] Navigate to `/dashboard/finance/accounts`
- [ ] Verify student account list loads
- [ ] Navigate to `/dashboard/finance/invoices`
- [ ] Check invoice list with student names
- [ ] Navigate to `/dashboard/finance/payments`
- [ ] Verify payment records show correct student and user names

## Breaking Changes
None for end users. This fixes existing broken functionality.

## Migration Notes
- **No database migration needed** - schema was already correct
- **No user data affected** - only fixed API queries
- All existing `full_name` data in profiles table is preserved
- Student import now correctly maps `firstName + lastName → full_name`

## Affected Endpoints
| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/admin/users` | GET, POST | ✅ Fixed |
| `/api/admin/users/[id]` | GET, PUT | ✅ Fixed |
| `/api/admin/users/[id]/reset-password` | POST | ✅ Fixed |
| `/api/admin/users/import` | POST | ✅ Fixed |
| `/api/admin/students/import` | POST | ✅ Fixed |
| `/api/admin/students/import/history` | GET | ✅ Fixed |
| `/api/classes/[classId]/students` | GET | ✅ Fixed |
| `/api/attendance/reports` | GET | ✅ Fixed |
| `/api/grades` | GET | ✅ Fixed |
| `/api/grades/student-overview` | GET | ✅ Fixed |
| `/api/admin/finance/student-accounts` | GET, POST | ✅ Fixed |
| `/api/admin/finance/invoices` | GET, POST | ✅ Fixed |
| `/api/admin/finance/payments` | GET, POST | ✅ Fixed |

## Build Status
- ✅ TypeScript compilation successful
- ✅ Build completed without errors
- ✅ All routes compile correctly
- ✅ Pre-commit hooks passed (husky + lint-staged)

## Related Issues
- Auth session cookie migration: See `AUTH_SESSION_FIX.md`
- Pre-commit hooks: Configured in root `package.json`
- Server layouts: Admin/teacher route protection active

## Next Steps
1. Wait for Vercel deployment to complete
2. Run through testing checklist above
3. Monitor for any remaining 500 errors
4. Consider adding TypeScript types to prevent future schema mismatches
