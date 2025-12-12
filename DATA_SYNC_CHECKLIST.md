# ✅ Data Sync Fix Checklist

## 🎯 YOUR IMMEDIATE TASK

- [ ] Read `START_DATA_SYNC_FIX.md`
- [ ] Check if `SUPABASE_SERVICE_ROLE_KEY` exists in `.env.local`
- [ ] Run `/api/debug/diagnose` endpoint
- [ ] Run `scripts/test-data-sync.ps1` script
- [ ] Check RLS policies in Supabase dashboard
- [ ] Report findings back

---

## 📊 PAGES WITH ISSUES

### Pages That Should Work But Don't:

| Page | Route | Expected | Actual | Issue |
|------|-------|----------|--------|-------|
| Students | `/dashboard/students` | 33 students | 0 records | RLS/Missing key |
| Classes | `/dashboard/classes` | 6 classes | Empty | RLS/Missing key |
| Attendance | `/dashboard/attendance` | 1,782 records | Empty | RLS/Missing key |
| Grades | `/dashboard/grades/*` | Grade data | Empty | RLS/Missing key |
| Finance | `/dashboard/admin/finance/*` | Invoice data | Empty | RLS/Missing key |

---

## 🔍 DIAGNOSTIC RESULTS EXPECTED

### Good Results:
```
✅ Service role key exists
✅ Database connection: OK
✅ All 12 tables accessible
✅ 33 students in database
✅ 6 classes in database
✅ 1,782 attendance records
```

### Bad Results (Examples):
```
❌ Service role key missing
❌ RLS policies blocking access to profiles
❌ RLS policies blocking access to classes
❌ 0 students found (empty table)
```

---

## 🛠️ FIXES THAT WILL BE APPLIED

### Fix 1 - Add Missing Service Role Key
**If:** Key doesn't exist
**Time:** 5 minutes
**Steps:**
1. Get key from Supabase
2. Add to `.env.local`
3. Restart app
4. Verify

### Fix 2 - Update RLS Policies
**If:** RLS blocking access
**Time:** 10 minutes
**Steps:**
1. Run SQL to fix policies
2. Grant service_role permissions
3. Verify access restored
4. Test endpoints

### Fix 3 - Standardize API Responses
**If:** Inconsistent response formats
**Time:** 20 minutes
**Steps:**
1. Update all endpoints
2. Use standard format: `{ success, data }`
3. Update useFetch hook
4. Test all pages

---

## ✅ VERIFICATION CHECKLIST

After fixes are applied:

### Test Each Page:
- [ ] `/dashboard/students` shows 33+ students
- [ ] `/dashboard/classes` shows 6+ classes
- [ ] `/dashboard/attendance` shows records with dates
- [ ] `/dashboard/grades/conduct-entry` shows students
- [ ] `/dashboard/grades/vietnamese-entry` shows students
- [ ] `/dashboard/admin/finance/invoices` shows invoices
- [ ] `/dashboard/admin/finance/payments` shows payments

### Test API Endpoints:
- [ ] `/api/admin/students` returns 33+ records
- [ ] `/api/classes` returns 6+ records
- [ ] `/api/attendance` returns records
- [ ] `/api/admin/academic-years` returns records
- [ ] `/api/admin/fee-types` returns records
- [ ] `/api/admin/finance/invoices` returns records
- [ ] `/api/admin/users?role=student` returns students

### Browser Console Tests:
```javascript
// Run this in browser console:
(async () => {
  const tests = {
    students: '/api/admin/students?limit=3',
    classes: '/api/classes?limit=3',
    attendance: '/api/attendance?limit=3'
  };
  
  for (const [name, url] of Object.entries(tests)) {
    const res = await fetch(url);
    const data = await res.json();
    const count = data.data?.length || data.students?.length || data.classes?.length || 0;
    console.log(`${name}: ${count > 0 ? '✅' : '❌'} (${count} records)`);
  }
})();
```

Expected output:
```
students: ✅ (3 records)
classes: ✅ (3 records)
attendance: ✅ (3 records)
```

---

## 📞 SUPPORT

### If You Get Stuck:
1. Check `DATA_SYNC_INVESTIGATION.md` for component-specific issues
2. Look for error messages in browser console (F12)
3. Look for error messages in terminal (where you ran `pnpm dev`)
4. Share the exact error message

### Files To Reference:
- `START_DATA_SYNC_FIX.md` - Step-by-step guide
- `DATA_SYNC_INVESTIGATION.md` - Full analysis
- `DATA_SYNC_FIX_PLAN.md` - Detailed fixes

---

## 🎯 TIMELINE

| Step | Time | Status |
|------|------|--------|
| Run diagnostics | 5 min | ← You are here |
| Report findings | 2 min | Pending |
| Apply fixes | 30 min | Pending |
| Verify | 10 min | Pending |
| **TOTAL** | **~45 min** | **To completion** |

---

## 🚀 START HERE

**Open:** `START_DATA_SYNC_FIX.md`

All tools are ready. Just follow the steps!

