# Testing Guide - Detail Pages

## Quick Test Instructions

### 1. Get Real IDs from Database

Open your browser console on the debug page and run:

```javascript
// Get student IDs
fetch('/api/admin/students?page=1&limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('Student IDs:', data.students?.map(s => ({
      id: s.id,
      name: s.full_name,
      code: s.student_code
    })));
  });

// Get class IDs
fetch('/api/classes')
  .then(r => r.json())
  .then(data => {
    console.log('Class IDs:', data.map(c => ({
      id: c.id,
      name: c.name
    })));
  });

// Get attendance IDs
fetch('/api/attendance')
  .then(r => r.json())
  .then(data => {
    console.log('Attendance IDs:', data.records?.slice(0, 5).map(a => ({
      id: a.id,
      student: a.student_id,
      class: a.class_id,
      date: a.date,
      status: a.status
    })));
  });
```

### 2. Test Detail Pages

Once you have real IDs, test these pages:

#### Student Detail Page
```
http://localhost:3000/dashboard/students/[STUDENT_ID]
```
**Expected**: Student profile with grades, attendance, and progress

#### Class Detail Page
```
http://localhost:3000/dashboard/admin/classes/[CLASS_ID]
```
**Expected**: Class info with students list and assignments

#### Attendance Detail Page (NEW) ✨
```
http://localhost:3000/dashboard/admin/attendance/[ATTENDANCE_ID]
```
**Expected**: 
- Student information card
- Class information card
- Editable attendance status (present/absent/late/excused/half_day)
- Notes field
- Save/Cancel buttons
- Color-coded status badges

### 3. Test CRUD Operations on Attendance Detail

1. **View** - Page loads with existing data
2. **Edit** - Click edit button, change status/notes
3. **Save** - Click save, verify changes persist
4. **Delete** - (Optional) Test delete button if implemented

### 4. Verify API Responses

Check browser console for:
- ✅ No 404 errors (table not found)
- ✅ No 500 errors (query failures)
- ✅ Data loads correctly
- ✅ Updates save successfully

### 5. Common Issues to Check

❌ **If you see errors about `attendance_records`**:
- That API file wasn't updated yet
- Check `docs/DATABASE_SCHEMA.md` for correct table names

❌ **If you see errors about `students` or `teachers` table**:
- Should use `profiles` table with `role` filter
- Check schema documentation

✅ **All fixed as of Dec 1, 2025**:
- `web/app/api/admin/attendance/[id]/route.ts`
- `web/app/api/admin/enrollments/[id]/route.ts`
- `web/app/api/dashboard/stats/route.ts`

---

## Automated Testing Results

**Last Test**: December 1, 2025, 6:18 PM
**Success Rate**: 100% (16/16 tests passed)

All critical APIs tested:
- ✅ Classes
- ✅ Grades
- ✅ Students
- ✅ Users
- ✅ Settings
- ✅ Attendance
- ✅ Finance
- ✅ Courses
- ✅ Dashboard Stats

---

## Database Schema Reference

For complete schema information, see: `docs/DATABASE_SCHEMA.md`

**Key Points**:
- Table is `attendance` (NOT `attendance_records`)
- Use `profiles` table for students/teachers (NO separate tables)
- Attendance statuses: `present`, `absent`, `late`, `excused`, `half_day`
- Classes table has NO `code` field
- Enrollments table has NO `created_at` field

---

## Next Steps

1. ✅ Schema documentation created
2. ✅ All API files fixed
3. ✅ Build passing (0 errors)
4. ✅ All API tests passing (100%)
5. ⏳ Manual testing of detail pages with real IDs
6. ⏳ E2E testing of CRUD operations

**Status**: Ready for production testing! 🚀
