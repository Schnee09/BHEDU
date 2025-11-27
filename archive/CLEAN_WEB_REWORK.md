# BH-EDU Clean Web Rework Plan

## Project Purpose
**Complete Student Management System** for schools covering:
- 👥 Student & Teacher Management
- 📚 Classes & Course Catalog (✅ WORKING)
- 📝 Enrollment Management
- 📊 Grades & Assignments
- ✅ Attendance Tracking
- 📈 Reports & Analytics
- 💰 Finance Management (fees, invoices, payments)

## Current Status
- ✅ Backend APIs fixed (all 7 core routes schema-aligned)
- ✅ Course Catalog working
- ❌ All other pages broken (using direct Supabase with RLS blocking)
- ❌ Schema mismatches throughout frontend
- ❌ Inconsistent data fetching patterns

---

## Phase 1: Core Data Architecture ✅
**Goal**: Establish proper data layer pattern

### 1.1 API Client Layer
- ✅ Created `/web/lib/api-client.ts` - unified API wrapper
- Pattern: `api.students.list()` instead of `supabase.from('profiles')`
- Consistent error handling
- TypeScript ready

---

## Phase 2: Core Management Pages (Priority Order)

### 2.1 Students Management 🎯 START HERE
**Files to update:**
- `/web/app/dashboard/students/page.tsx` - List view
- `/web/app/dashboard/students/[id]/page.tsx` - Detail view
- `/web/app/dashboard/students/[id]/edit/page.tsx` - Edit form

**Changes:**
- Remove all `supabase.from('profiles')` calls
- Use `api.students.list()`, `api.students.get(id)`
- Remove non-existent columns: `status`, `department`
- Keep only: `id, full_name, email, role, date_of_birth, phone, address, created_at`

### 2.2 Teachers Management
**Files:**
- `/web/app/dashboard/admin/teachers/page.tsx`
- Create detail/edit pages

**Schema:** Same as students (both use profiles table)

### 2.3 Classes Management
**Files:**
- `/web/app/dashboard/classes/page.tsx`
- `/web/app/dashboard/admin/classes/page.tsx`

**Schema:** `id, name, teacher_id, created_at` (only 4 columns!)
- Remove: code, description, grade_level, status, academic_year, room, schedule, max_students

### 2.4 Enrollments Management
**Files:**
- `/web/app/dashboard/admin/enrollments/page.tsx`
- Create enrollment forms in class/student detail pages

**Schema:** `id, student_id, class_id, enrollment_date, status`

### 2.5 Grades & Assignments
**Files:**
- `/web/app/dashboard/scores/page.tsx` - Rename to grades
- `/web/app/dashboard/admin/grades/page.tsx`
- `/web/app/dashboard/admin/assignments/page.tsx`

**Grades Schema:** `id, assignment_id, student_id, score, feedback, graded_at, graded_by`
**Assignments Schema:** `id, class_id, category_id, title, description, due_date, max_points`

### 2.6 Attendance
**Files:**
- `/web/app/dashboard/admin/attendance/page.tsx`

**Schema:** `id, student_id, class_id, date, status, check_in_time, check_out_time, notes, marked_by`

---

## Phase 3: Dashboard & Reports

### 3.1 Main Dashboard
**File:** `/web/app/dashboard/page.tsx`
**Show:**
- Total students/teachers/classes counts
- Recent attendance
- Upcoming assignments
- Quick stats

### 3.2 Reports
**File:** `/web/app/dashboard/reports/page.tsx`
**Generate:**
- Attendance reports by class/date range
- Grade reports by student/class
- Enrollment statistics

---

## Phase 4: Authentication & Roles

### 4.1 User Roles
- **Admin**: Full access to all management pages
- **Teacher**: Own classes, grades, attendance
- **Student**: View own grades, assignments, attendance

### 4.2 Route Protection
- Add role checks to admin pages
- Redirect unauthorized users

---

## Phase 5: Finance Module (Optional - Later)

Only if needed:
- Fee management
- Invoice generation
- Payment tracking

---

## Implementation Strategy

### Immediate Next Steps:
1. ✅ API Client created
2. **Start with Students page** - it's the most important
3. Use students page as template for teachers
4. Move to classes (simplest - 4 columns only)
5. Then enrollments (connects students + classes)
6. Finally grades/assignments/attendance

### Pattern for Each Page:
```typescript
// OLD (broken)
const { data } = await supabase.from('profiles').select('*');

// NEW (working)
import { api } from '@/lib/api-client';
const students = await api.students.list({ search: query });
```

### Testing Approach:
- Fix one page at a time
- Test in browser immediately
- Verify data loads
- Move to next page

---

## Success Criteria
- ✅ All core management pages load data
- ✅ CRUD operations work for students/teachers/classes
- ✅ Enrollments connect students to classes
- ✅ Grades & attendance can be recorded
- ✅ No direct Supabase calls in frontend
- ✅ Consistent UI/UX across all pages

---

## Current Decision Point
**YOU SAID: "I really think we could do a clean web rework"**

**MY RECOMMENDATION:**
Start with **Students Management** page right now. It's the foundation. Once that works perfectly, we can quickly replicate the pattern to all other pages.

**Should I proceed with rewriting the Students page using the new API client?**
