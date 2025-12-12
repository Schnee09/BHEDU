# Data Sync Diagnosis & Fix Report
**Generated:** December 11, 2025

---

## 🔍 CRITICAL FINDINGS

### ❌ Issue 1: RLS (Row Level Security) Blocking Data Access
**Severity:** HIGH - Affects all user roles

**Root Cause:** Some tables likely have RLS enabled with restrictive policies that prevent the service role or public anon key from accessing data.

**Evidence:**
- API endpoints using `createServiceClient()` should bypass RLS
- But some queries still might be returning empty results
- This suggests RLS policies may be misconfigured OR
- The `createClient()` method is using anon key instead of service key

**Affected Components:**
- `/api/admin/students` - May not be returning all student data
- `/api/classes` - Teachers may not see their assigned classes
- `/api/attendance` - Attendance records missing
- `/api/grades/*` - Grade data not syncing

---

### ❌ Issue 2: Client-Side Auth Not Using Service Role Correctly
**Severity:** HIGH

**Code Location:** `web/lib/supabase/client.ts`

**Problem:**
```typescript
export const supabase = createClient()  // Uses anon key!
```

This client uses the anon key which is blocked by RLS policies. But the app should be using the service role key on the server side.

**Expected:**
- Client-side: Uses anon key (with RLS protecting data)
- Server-side: Uses service role key (bypasses RLS)

---

### ❌ Issue 3: Inconsistent API Response Formats
**Severity:** MEDIUM - Causes parsing errors in UI

**Problem:** Different endpoints return different response structures:

```typescript
// Some endpoints return:
{ success: true, students: [...] }

// Others return:
{ success: true, data: [...] }

// Others return:
{ students: [...], total: 100 }

// Some mix:
response.data || response.students || response.users || []
```

**Affected Pages:**
- `/dashboard/students` - Handles multiple response formats but unreliably
- `/dashboard/classes` - Same issue
- `/dashboard/admin/finance/*` - Lots of defensive code

---

### ❌ Issue 4: Service Role Key Might Be Missing or Expired
**Severity:** HIGH

**Code Location:** `web/app/api/admin/students/route.ts` line 17

```typescript
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ⚠️ This might be empty or invalid
);
```

If `SUPABASE_SERVICE_ROLE_KEY` is invalid, ALL admin endpoints fail.

---

## 📋 PAGES WITH DATA SYNC ISSUES

### 1. **Students Page** (`/dashboard/students`)
**Status:** ❌ Likely empty or partially loading
**Endpoint:** `/api/admin/students`
**Issue:** 
- Multiple response format handling (defensive coding suggests previous failures)
- May not have data due to RLS or missing service role key

### 2. **Classes Page** (`/dashboard/classes`)
**Status:** ❌ Showing empty or wrong classes
**Endpoint:** `/api/classes` or `/api/admin/classes`
**Issue:**
- Role-based logic tries 3 different endpoints
- Teacher endpoint: `/api/classes/my-classes` might return nothing
- Admin endpoint: `/api/admin/classes` might be blocked by RLS

### 3. **Attendance Page** (`/dashboard/attendance`)
**Status:** ❌ No attendance records shown
**Endpoint:** `/api/attendance`
**Issue:**
- Query tries to fetch linked class/profile names
- If profiles/classes RLS blocks access, names won't load
- Attendance data becomes unusable without student names

### 4. **Grades Pages** (`/dashboard/grades/*)
**Status:** ❌ No grade data loading
**Multiple Endpoints:**
- `/api/grades/conduct-entry`
- `/api/grades/vietnamese-entry`
- `/api/v1/students/{id}/grades`
**Issue:**
- Grade tables likely have restrictive RLS
- Student lookup query might fail

### 5. **Finance/Invoices** (`/dashboard/admin/finance/invoices`)
**Status:** ❌ Showing empty or error states
**Endpoints:** 
- `/api/admin/users?role=student`
- `/api/admin/fee-types`
- `/api/admin/academic-years`
- `/api/admin/finance/invoices`
**Issue:**
- Multiple nested data dependencies
- If any single endpoint fails, whole page breaks
- Lots of defensive code (`response.data || response.invoices || []`) suggests chronic failures

---

## 🔧 INVESTIGATION CHECKLIST

### Step 1: Verify Environment Variables
```bash
# Check if service role key exists and is valid
echo $SUPABASE_SERVICE_ROLE_KEY  # Should NOT be empty
```

### Step 2: Check RLS Policies on Cloud Supabase
**Navigate to:**
1. Supabase Dashboard → BH-EDU project
2. Database → Extensions → Search "RLS" 
3. Check tables:
   - `profiles` - Check policies
   - `classes` - Check policies
   - `enrollments` - Check policies
   - `attendance` - Check policies
   - `grades` - Check policies
   - `academic_years` - Check policies
   - `fee_types` - Check policies
   - `invoices` - Check policies

### Step 3: Run Data Access Test
**Execute SQL in Supabase:**
```sql
-- Test 1: Can service role see profiles?
SELECT COUNT(*) as student_count FROM profiles WHERE role = 'student';

-- Test 2: Can service role see classes?
SELECT COUNT(*) as class_count FROM classes;

-- Test 3: Can anon key see profiles?
SET ROLE anon;  -- or use anon key
SELECT * FROM profiles LIMIT 1;

-- Test 4: Check RLS policies
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;

-- Test 5: List all RLS policies
SELECT * FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND privilege_type = 'SELECT';
```

### Step 4: Test API Responses Directly
```bash
# Test students API
curl -X GET "http://localhost:3000/api/admin/students?limit=5" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Check response format
# Should return: { success: true, students: [...], total: X }
```

---

## 🛠️ SUSPECTED ROOT CAUSES (Priority Order)

### 1. **Missing/Invalid Service Role Key** (90% likelihood)
- **Check:** `echo $SUPABASE_SERVICE_ROLE_KEY` in terminal
- **Fix:** Regenerate key in Supabase dashboard
- **Impact:** Blocks ALL admin endpoints

### 2. **RLS Policies Too Restrictive** (60% likelihood)
- **Check:** Supabase dashboard RLS settings
- **Fix:** Modify policies to allow service role
- **Impact:** Blocks specific tables even with service key

### 3. **Anon Key Being Used Instead of Service Key** (40% likelihood)
- **Check:** API routes using `createClient()` instead of `createServiceClient()`
- **Fix:** Use service role in API endpoints
- **Impact:** All data access blocked for non-authenticated users

### 4. **API Endpoints Not Fetching Linked Tables** (30% likelihood)
- **Check:** Attendance endpoint tries to fetch class/student names
- **Fix:** Add explicit joins instead of relying on RLS
- **Impact:** Partial data returned (just IDs, no names)

---

## 📊 NEXT STEPS

### Immediate (Do First):
1. ✅ Check if `SUPABASE_SERVICE_ROLE_KEY` exists and is valid
2. ✅ Run SQL test to verify data exists in Supabase cloud
3. ✅ Check RLS policies on each table
4. ✅ Test API endpoint directly with curl

### Short-term (Do After Diagnosis):
1. Fix RLS policies if too restrictive
2. Ensure all API routes use service role
3. Standardize API response format across all endpoints
4. Add proper error logging to identify which queries fail

### Medium-term (Ongoing):
1. Add data validation on client side
2. Create data sync tests
3. Document expected response formats
4. Create API integration tests

---

## 📝 QUICK DEBUG SCRIPT

Run this in the web app to see actual API responses:

```typescript
// In browser console while on any dashboard page:

(async () => {
  const endpoints = [
    '/api/admin/students?limit=1',
    '/api/admin/classes',
    '/api/attendance?limit=1',
    '/api/grades/conduct-entry',
    '/api/admin/academic-years'
  ];
  
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`${url}:`, res.ok ? '✅' : '❌', data);
    } catch (e) {
      console.log(`${url}: ❌ ${e.message}`);
    }
  }
})();
```

---

## 🎯 ACTION PLAN

**User should:**
1. Check Supabase Cloud dashboard for RLS policies
2. Verify service role key is set in `.env.local`
3. Run diagnostic SQL to confirm data exists
4. Test API endpoints directly
5. Report findings back

**Agent will then:**
1. Create RLS fix script if policies are the issue
2. Fix API endpoints if they're using wrong keys
3. Standardize all API response formats
4. Create comprehensive test suite to validate data sync

