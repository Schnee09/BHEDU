# Data Sync Fix & Test Plan
**Status:** Ready for Implementation
**Last Updated:** December 11, 2025

---

## 🎯 ROOT CAUSES IDENTIFIED

### Issue 1: RLS Policies Blocking Data Access (⚠️ MOST LIKELY)
**Location:** Supabase Cloud Database
**Problem:** 
- Tables have RLS enabled but policies don't allow service role to access
- OR profiles/policies are incorrectly set up
- OR anon key policies are too restrictive

**Impact:** 
- Empty student list
- Empty classes list
- Missing attendance records
- No grade data

**Check Cmd:**
```sql
-- In Supabase SQL Editor, run:
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true 
ORDER BY tablename;
```

---

### Issue 2: Missing or Invalid Service Role Key
**Location:** Environment Variables
**Problem:** 
- `SUPABASE_SERVICE_ROLE_KEY` may be missing, expired, or incorrect
- API endpoints that use `createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!)` will fail

**Impact:**
- Admin endpoints return 401/403
- `/api/admin/students`, `/api/admin/classes`, etc. all fail

**Check Cmd:**
```bash
# In terminal at project root:
echo $SUPABASE_SERVICE_ROLE_KEY
# If empty, key is missing!

# Check .env.local for the key
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

---

### Issue 3: Inconsistent API Response Formats
**Location:** Multiple API endpoints
**Problem:**
```typescript
// API returns different formats:
{ students: [...], total: 100 }              // ❌ Old format
{ success: true, data: [...], total: 100 }   // ✅ New format  
{ data: [...] }                              // ❌ Missing success flag
```

**UI Code tries to handle all formats:**
```typescript
response.data || response.students || response.users || []
```

**Impact:** 
- Inconsistent data access
- Hard to debug
- Easy to miss data

---

## ✅ IMMEDIATE ACTION ITEMS

### Step 1: Verify Service Role Key ✋ **USER ACTION NEEDED**

```bash
# Open terminal and run:
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

**If you see output:** Good, key exists. Report the first 20 characters to verify it looks valid.

**If empty:** Need to add key from Supabase dashboard.

---

### Step 2: Check RLS Policies in Supabase Dashboard ✋ **USER ACTION NEEDED**

1. Go to: https://app.supabase.com
2. Select "BH-EDU" project
3. Go to: **Database** → **Authentication** → **Policies**
4. For each table (`profiles`, `classes`, `attendance`, `grades`):
   - Check if RLS is enabled (toggle should be ON)
   - List all policies
   - Verify service role has access

**Expected:**
- Service role should have `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions
- Anon key may have restricted access

---

### Step 3: Run Diagnostic Endpoint

```bash
# In your web app, open browser console and run:
fetch('/api/debug/diagnose')
  .then(r => r.json())
  .then(data => {
    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log(JSON.stringify(data, null, 2));
  });
```

**What to look for:**
- `serviceKeyValid: true` ✅
- `databaseConnection: "OK"` ✅
- No tables in `rlsBlocked` array ✅
- Row counts for each table > 0 ✅

**If problems:**
- Copy the `recommendations` array
- Report back what it says

---

## 🔧 FIXES TO APPLY

### Fix 1: Add Missing Service Role Key (If Empty)

**Location:** `web/.env.local`

**Steps:**
1. Go to Supabase dashboard
2. Settings → API → Copy "Service Role" key (not "anon" key)
3. Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```
4. Restart web app: `pnpm dev`

---

### Fix 2: Verify/Fix RLS Policies

**If tables are RLS-blocked, run this SQL in Supabase SQL Editor:**

```sql
-- Fix 1: Enable service role access to profiles
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;
CREATE POLICY "Service role can do anything" 
  ON profiles 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix 2: Enable service role access to classes
DROP POLICY IF EXISTS "Service role can do anything" ON classes;
CREATE POLICY "Service role can do anything" 
  ON classes 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix 3: Enable service role access to enrollments
DROP POLICY IF EXISTS "Service role can do anything" ON enrollments;
CREATE POLICY "Service role can do anything" 
  ON enrollments 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix 4: Enable service role access to attendance
DROP POLICY IF EXISTS "Service role can do anything" ON attendance;
CREATE POLICY "Service role can do anything" 
  ON attendance 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Fix 5: Enable service role access to grades
DROP POLICY IF EXISTS "Service role can do anything" ON grades;
CREATE POLICY "Service role can do anything" 
  ON grades 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
```

---

### Fix 3: Standardize API Response Format

**Location:** All API endpoints

**Current Problem:**
```typescript
// Different endpoints return different structures
```

**Solution - Use standardized helper:**

```typescript
// All endpoints should return:
{
  success: true,
  data: [...],     // Always array for lists
  total?: number,  // If paginated
  pagination?: {
    page: number,
    limit: number,
    total: number
  }
}

// On error:
{
  success: false,
  error: "Human readable message"
}
```

**Where to fix:**
1. `/api/admin/students` ✅ Mostly correct
2. `/api/admin/classes` - Check response format
3. `/api/attendance` - Returns `data` array
4. `/api/grades/*` - Check consistency
5. `/api/admin/users` - Check consistency

---

## 📋 DETAILED COMPONENT ISSUES & FIXES

### Component 1: Students Page (`/dashboard/students`)

**File:** `web/app/dashboard/students/page.tsx`

**Current Status:** 
- Uses `useFetch` hook
- Endpoint: `/api/admin/students`
- Expected: Should show all students with pagination

**Potential Issues:**
```typescript
// Line 100-105: Tries multiple response formats
const { data, loading, error, refetch } = useFetch<{
  students: Student[];
  total: number;
  statistics?: StudentStats;
}>(apiEndpoint);
```

**Issue:** Endpoint returns `{ success: true, students, total }` but hook expects `data.success || data.data`

**Fix:**
```typescript
// In hook/useFetch.ts, make sure to handle:
const fetchedData = result.data || result.students || result;
setData(fetchedData);
```

**Test:**
```bash
# API should return 30+ students (from your data export)
curl "http://localhost:3000/api/admin/students?limit=10" | jq '.students | length'
# Should output: 10 (or your limit)
```

---

### Component 2: Classes Page (`/dashboard/classes`)

**File:** `web/app/dashboard/classes/page.tsx`

**Current Status:**
- Shows empty class list OR wrong classes
- Teachers only see their classes
- Admin sees all classes

**Issue:**
```typescript
// Line 80-83: Uses different endpoints based on role
const apiEndpoint = !profile 
  ? null 
  : isAdminOrStaff 
    ? '/api/admin/classes'     // ← May not exist!
    : isStudent 
      ? '/api/student/classes' // ← May not exist!
      : '/api/classes/my-classes';
```

**Problem:** `/api/admin/classes` endpoint might not exist!

**Check:**
```bash
ls -la web/app/api/admin/ | grep classes
# If no output, endpoint doesn't exist
```

**Fix:** Create the missing endpoint OR use existing `/api/classes` endpoint

---

### Component 3: Attendance Page (`/dashboard/attendance`)

**File:** `web/app/dashboard/attendance/page.tsx`

**Current Status:**
- Shows empty attendance OR incomplete records (just IDs, no names)

**Issue:** 
```typescript
// Code tries to fetch student/class names after getting attendance
// If RLS blocks profiles/classes query, names won't load
```

**Fix Strategy:**
```typescript
// Instead of 2 queries:
1. Fetch attendance
2. Fetch names separately

// Do it efficiently:
SELECT 
  a.id, a.class_id, a.student_id, a.date, a.status,
  p.full_name as student_name,
  c.name as class_name
FROM attendance a
LEFT JOIN profiles p ON p.id = a.student_id
LEFT JOIN classes c ON c.id = a.class_id
```

---

### Component 4: Grades Pages (`/dashboard/grades/*`)

**Files:** 
- `web/app/dashboard/grades/conduct-entry/page.tsx`
- `web/app/dashboard/grades/vietnamese-entry/page.tsx`

**Current Status:**
- Shows empty student list OR no grade data

**Issue:**
```typescript
// Endpoint: /api/grades/conduct-entry
// Returns: { success: true, students: [...] }
// But code tries multiple data paths
```

**Fix:**
1. Verify `/api/grades/` endpoints exist
2. Ensure they return consistent format
3. Check if student data is being fetched correctly

**Test:**
```bash
# Should return students for a class
curl "http://localhost:3000/api/grades/conduct-entry?class_id=XXX" | jq '.students'
```

---

### Component 5: Finance Pages (`/dashboard/admin/finance/*`)

**Files:**
- `web/app/dashboard/admin/finance/invoices/page.tsx`
- `web/app/dashboard/admin/finance/payments/page.tsx`

**Current Status:**
- Lots of empty states and error handling
- Multiple API failures being silently caught

**Issues:**
1. `/api/admin/finance/invoices` might not exist
2. Multiple dependent endpoints need data in right order
3. Defensive code indicates chronic failures

**Fix:**
1. Verify all 5 required endpoints exist:
   - `/api/admin/users?role=student`
   - `/api/admin/fee-types`
   - `/api/admin/academic-years`
   - `/api/admin/finance/invoices`
   - `/api/admin/finance/payment-methods`

2. Create missing endpoints or fix routing

---

## 🧪 TEST CHECKLIST

After making fixes, test each endpoint:

```bash
# 1. Test Students
curl "http://localhost:3000/api/admin/students?limit=1" | jq '.'
# Expected: { success: true, students: [...], total: N }

# 2. Test Classes  
curl "http://localhost:3000/api/classes" | jq '.'
# Expected: { success: true, classes: [...] }

# 3. Test Attendance
curl "http://localhost:3000/api/attendance?limit=1" | jq '.'
# Expected: { success: true, data: [...] }

# 4. Test Grades
curl "http://localhost:3000/api/grades/conduct-entry" | jq '.'
# Expected: { success: true, data: [...] }

# 5. Test Academic Years
curl "http://localhost:3000/api/admin/academic-years" | jq '.'
# Expected: { success: true, data: [...] }
```

---

## ✋ USER INSTRUCTIONS

**Do this NOW:**

1. **Check Service Role Key:**
   ```bash
   grep SUPABASE_SERVICE_ROLE_KEY web/.env.local
   ```
   - If empty → Get key from Supabase dashboard
   - If present → Good!

2. **Run Diagnostic:**
   ```bash
   # Visit http://localhost:3000/api/debug/diagnose
   # Copy the JSON response and share with me
   ```

3. **Check RLS Policies:**
   - Go to Supabase dashboard
   - Check if any tables show RLS issues
   - Share any error messages

4. **Report Findings:**
   - Which pages show no data?
   - Which API endpoints fail?
   - What do the errors say?

---

## 📞 NEXT STEPS

Once you provide the diagnostic output and RLS status, I will:

1. ✅ Fix RLS policies if needed
2. ✅ Add/update service role key if missing
3. ✅ Standardize all API response formats
4. ✅ Create comprehensive test suite
5. ✅ Verify all pages load with real data

**Estimated time to fix:** 30-45 minutes once we confirm root cause

