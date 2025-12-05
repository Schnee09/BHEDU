# 🚀 BH-EDU Web Optimization Plan

## Current Issues Analysis

### ✅ Working Pages (Use API Routes Properly)
- `/dashboard/users` - Uses `apiFetch('/api/admin/users')`
- `/dashboard/finance` - Uses `apiFetch('/api/admin/finance')`
- `/dashboard/students` - Uses `api.students.list()`
- `/dashboard/classes` - Uses `api.classes.list()`

### ❌ Broken Pages (Direct Supabase + RLS Issues)
- `/dashboard/attendance` - **FIXED** but needs RLS SQL run
- `/dashboard/assignments` - **FIXED** but needs RLS SQL run
- `/dashboard/grades` - Just navigation page (OK)
- Other admin pages - Need investigation

## Root Causes

### 1. **Row Level Security (RLS) Blocking Client Queries**
- Client pages query Supabase directly with JOINs
- RLS policies don't allow admin to read all tables
- **Solution**: Use API routes with service role key

### 2. **Inconsistent API Patterns**
- Some pages use `apiFetch()` (good)
- Some pages use `api.*` wrappers (good)
- Some pages use direct `supabase.from()` (bad - blocked by RLS)
- **Solution**: Standardize on API routes

### 3. **Missing API Endpoints**
Currently have:
- ✅ `/api/attendance` - Just created
- ✅ `/api/assignments` - Just created
- ✅ `/api/classes/my-classes` - Exists
- ✅ `/api/admin/users` - Exists
- ✅ `/api/admin/finance` - Exists
- ✅ `/api/admin/students` - Exists
- ✅ `/api/admin/teachers` - Exists

Need to verify:
- `/api/admin/attendance`
- `/api/admin/assignments`
- `/api/admin/grades`
- `/api/admin/classes`

## Fix Strategy

### Phase 1: Database (CRITICAL - Do First!)
**Run this SQL in Supabase:**
```sql
-- File: supabase/COMPLETE_RLS_FIX.sql
```

This grants:
- Everyone can VIEW (SELECT) all tables
- Admins can DO EVERYTHING
- Teachers can MODIFY their own data
- Students can VIEW their own data

### Phase 2: API Routes (In Progress)
**Created:**
- ✅ `/api/attendance/route.ts` - Fetches attendance with auth
- ✅ `/api/assignments/route.ts` - Fetches assignments with auth

**Need to verify:**
- Check if `/api/admin/*` routes exist and work

### Phase 3: Frontend Pages (50% Done)
**Updated:**
- ✅ `/dashboard/attendance/page.tsx` - Now uses `/api/attendance`
- ✅ `/dashboard/assignments/page.tsx` - Now uses `/api/assignments`

**Need to update:**
- Check all admin pages in `/dashboard/admin/*`
- Check all other pages for direct Supabase queries

## Testing Checklist

After running COMPLETE_RLS_FIX.sql:

### Admin User Should Access:
- [ ] `/dashboard/attendance` - View all attendance
- [ ] `/dashboard/assignments` - View all assignments
- [ ] `/dashboard/classes` - View all classes
- [ ] `/dashboard/students` - View all students
- [ ] `/dashboard/grades` - View all grades
- [ ] `/dashboard/users` - Manage users
- [ ] `/dashboard/finance` - View financial data
- [ ] `/dashboard/admin/*` - All admin pages

### Teacher User Should Access:
- [ ] `/dashboard/attendance` - View own classes' attendance
- [ ] `/dashboard/assignments` - View own classes' assignments
- [ ] `/dashboard/classes` - View own classes
- [ ] `/dashboard/students` - View enrolled students
- [ ] `/dashboard/grades` - View own classes' grades

### Student User Should Access:
- [ ] `/dashboard/attendance` - View own attendance
- [ ] `/dashboard/assignments` - View enrolled classes' assignments
- [ ] `/dashboard/grades` - View own grades
- [ ] `/dashboard/scores` - View own scores

## Next Steps

1. **IMMEDIATE**: Run `supabase/COMPLETE_RLS_FIX.sql` in Supabase SQL Editor
2. **TEST**: Refresh `/dashboard/attendance` and `/dashboard/assignments` pages
3. **VERIFY**: Check browser console for errors
4. **AUDIT**: Check all pages in `/dashboard/admin/*` directory
5. **FIX**: Convert any remaining direct Supabase queries to API routes

## API Design Patterns

### Good Pattern ✅
```typescript
// In page.tsx
const response = await fetch("/api/attendance", {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
const { data } = await response.json();
```

### Bad Pattern ❌
```typescript
// In page.tsx - Don't do this!
const { data } = await supabase
  .from("attendance")
  .select("*, profiles(full_name), classes(name)"); // Blocked by RLS!
```

### API Route Template
```typescript
// In app/api/[resource]/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
);

export async function GET(request: NextRequest) {
  // 1. Get auth token from header
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  // 2. Verify user and get role
  const { data: { user } } = await supabase.auth.getUser(token);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  // 3. Build query based on role
  let query = supabase.from("table").select("*");
  if (profile.role === "teacher") {
    query = query.eq("teacher_id", user.id);
  } else if (profile.role === "student") {
    query = query.eq("student_id", user.id);
  }
  // Admin sees all (no filter)
  
  // 4. Execute and return
  const { data, error } = await query;
  return NextResponse.json({ data });
}
```

## Files Changed

### Created:
1. `web/app/api/attendance/route.ts` - New API endpoint
2. `web/app/api/assignments/route.ts` - New API endpoint
3. `supabase/COMPLETE_RLS_FIX.sql` - Comprehensive RLS fix

### Modified:
1. `web/app/dashboard/attendance/page.tsx` - Converted to API call
2. `web/app/dashboard/assignments/page.tsx` - Converted to API call

### To Investigate:
1. All files in `web/app/dashboard/admin/*`
2. Any pages using `useProfile` + `supabase.from()`
3. Check for 500 errors in browser console

## Success Criteria

✅ No 500 errors in browser console
✅ Admin can access all pages
✅ Teacher can access teacher pages
✅ Student can access student pages
✅ All data loads correctly with proper filtering
✅ No RLS policy errors in console

