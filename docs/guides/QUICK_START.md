# Quick Start Guide - Admin System Development

## What We Just Created

### 📊 Database Analysis
- **File**: `DATABASE_ANALYSIS.md`
- **What**: Complete analysis of 27 tables, identified missing CRUD systems
- **Use**: Reference for understanding database structure

### 🌱 Seed Data (3 parts)
- **Files**: 
  - `supabase/migrations/035_comprehensive_seed_data_part1.sql` (Users)
  - `supabase/migrations/035_comprehensive_seed_data_part2.sql` (Classes, Relationships)
  - `supabase/migrations/035_comprehensive_seed_data_part3.sql` (Assignments, Grades, Financial)
  - `supabase/migrations/035_SEED_DATA_README.md` (Documentation)
- **What**: Realistic test data - 75 users, 50 classes, 315 enrollments, full financial records
- **Use**: Testing all system functions with realistic data

### 📋 Implementation Plan
- **File**: `ADMIN_CRUD_PLAN.md`
- **What**: 4-week roadmap for building 7 admin CRUD systems
- **Use**: Step-by-step guide for development

### 📝 Summary
- **File**: `PHASE_13_SUMMARY.md`
- **What**: Everything we accomplished in Phase 13
- **Use**: Quick reference of what's done and what's next

## How to Use the Seed Data

### Option 1: Supabase CLI (Recommended)
```bash
# Reset database and apply all migrations including seed data
supabase db reset
```

### Option 2: Manual SQL Execution
```bash
# Apply the 3 parts in order
psql $DATABASE_URL -f supabase/migrations/035_comprehensive_seed_data_part1.sql
psql $DATABASE_URL -f supabase/migrations/035_comprehensive_seed_data_part2.sql
psql $DATABASE_URL -f supabase/migrations/035_comprehensive_seed_data_part3.sql
```

### Option 3: Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Paste Part 1 → Execute
3. Paste Part 2 → Execute
4. Paste Part 3 → Execute

## Verify Seed Data Loaded

```sql
-- Run this query to check all data loaded
SELECT 
  'Students' as entity, COUNT(*) as count FROM profiles WHERE role = 'student'
UNION ALL
SELECT 'Teachers', COUNT(*) FROM profiles WHERE role = 'teacher'
UNION ALL
SELECT 'Admins', COUNT(*) FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Guardians', COUNT(*) FROM guardians
UNION ALL
SELECT 'Assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;
```

**Expected Results**:
- Students: 50
- Teachers: 20
- Admins: 5
- Classes: 50
- Enrollments: ~315
- Guardians: 50
- Assignments: 40
- Attendance Records: ~1000
- Grades: ~20
- Invoices: ~50
- Payments: ~35

## Test Existing Features

### Student CRUD (Already Built)
1. Go to `/dashboard/students`
2. You should see 50 students
3. Try filters: Grade 1, Grade 6, Grade 9, Grade 12
4. Try search: Type "Alice" or "Bob"
5. Click on a student → See guardian info
6. Test enrollment manager
7. Export to CSV

### Check Data Quality
```sql
-- View class rosters
SELECT 
  c.name as class_name,
  c.grade_level,
  COUNT(e.id) as enrolled_students,
  c.capacity
FROM classes c
LEFT JOIN enrollments e ON e.class_id = c.id
GROUP BY c.id, c.name, c.grade_level, c.capacity
ORDER BY c.grade_level, c.name;

-- Check student balances
SELECT 
  p.full_name,
  p.student_id,
  sa.balance
FROM profiles p
JOIN student_accounts sa ON sa.student_id = p.id
WHERE p.role = 'student'
ORDER BY p.grade_level, p.full_name;

-- View attendance rates
SELECT 
  p.full_name,
  p.grade_level,
  COUNT(*) FILTER (WHERE a.status = 'present') as present,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / COUNT(*), 1) as attendance_rate
FROM profiles p
JOIN attendance a ON a.student_id = p.id
GROUP BY p.id, p.full_name, p.grade_level
ORDER BY attendance_rate DESC
LIMIT 20;
```

## Start Building Admin CRUD

### Priority 1: Classes CRUD (Start Here!)

#### Step 1: Create API (Day 1 Morning)
```bash
# Create the file
touch web/app/api/admin/classes/route.ts
```

**Reference**: `ADMIN_CRUD_PLAN.md` → "Priority 1: Classes CRUD" → "API Endpoints"

**What to build**:
- GET: List classes with filters (grade, subject, teacher, academic year)
- POST: Create new class with validation
- Include pagination (page, pageSize)
- Include search (by class name)
- Return: `{ data: Class[], totalCount: number }`

#### Step 2: Create Single Class API (Day 1 Morning)
```bash
touch web/app/api/admin/classes/[id]/route.ts
```

**What to build**:
- GET: Get single class with enrolled students
- PUT: Update class details
- DELETE: Archive class (soft delete)

#### Step 3: Create Bulk Actions API (Day 1 Afternoon)
```bash
touch web/app/api/admin/classes/bulk/route.ts
```

**What to build**:
- POST: Bulk archive, bulk export

#### Step 4: Create List Page (Day 1 Afternoon)
```bash
touch web/app/dashboard/admin/classes/page.tsx
```

**What to build**:
- DataTable with columns: Name, Subject, Grade, Teacher, Room, Capacity, Enrolled, Status
- Use existing DataTable component pattern from students
- Pagination controls
- Search bar
- Create button

#### Step 5: Create Filters Component (Day 2 Morning)
```bash
touch web/components/ClassFilters.tsx
```

**What to build**:
- Grade level dropdown
- Subject dropdown
- Teacher select
- Academic year select
- Status toggle (active/archived)

#### Step 6: Create Form Modal (Day 2 Morning)
```bash
touch web/components/ClassFormModal.tsx
```

**What to build**:
- Fields: Name, Subject, Grade Level, Teacher, Academic Year, Schedule, Room, Capacity
- Validation with Zod
- Schedule builder (simple JSON input for now, can enhance later)
- Submit handler

#### Step 7: Test Everything (Day 2 Afternoon)
- Create a new class
- Edit existing class
- Archive a class
- Filter by grade level
- Search by name
- Export CSV
- View class roster

### Priority 2: Assignments CRUD (After Classes)
Follow same pattern in `ADMIN_CRUD_PLAN.md`

### Priority 3: Financial Admin
Follow same pattern in `ADMIN_CRUD_PLAN.md`

## Development Tips

### Use Existing Patterns
Look at these files for proven patterns:
- **API**: `web/app/api/students/route.ts`
- **List Page**: `web/app/dashboard/students/page.tsx`
- **Form Modal**: `web/components/StudentFormModal.tsx` (if exists)
- **Filters**: Any existing filter components

### Copy Student CRUD Patterns
The student CRUD already has:
- ✅ Pagination
- ✅ Filtering
- ✅ Sorting
- ✅ Search
- ✅ Bulk actions
- ✅ CSV export
- ✅ Toast notifications
- ✅ Confirmation modals
- ✅ Loading states

**Just adapt for classes/assignments/etc!**

### Database Queries with RLS
All queries must respect RLS. Use Supabase client:
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data, error } = await supabase
  .from('classes')
  .select('*, teacher:profiles!teacher_id(*)')
  .eq('status', 'active')
  .range(start, end)
```

### Validation with Zod
```typescript
import { z } from 'zod'

const classSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  teacherId: z.string().uuid('Invalid teacher'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  // ... more fields
})
```

### Error Handling
```typescript
try {
  // ... operation
  return NextResponse.json({ data })
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'Failed to perform operation' },
    { status: 500 }
  )
}
```

## Useful Commands

### Check Current Data
```bash
# Connect to local Supabase
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or check via Supabase CLI
supabase db pull
```

### Run Development Server
```bash
cd web
pnpm dev
```

### Build and Test
```bash
cd web
pnpm build
pnpm lint
```

### Git Workflow
```bash
# After completing Classes CRUD
git add .
git commit -m "feat: add classes CRUD admin interface

- API routes for classes CRUD
- List page with filters and search
- Create/edit form modal
- Bulk actions and export
- Schedule builder
- Tested with 50 classes from seed data"

git push
```

## Resources

### Documentation Files
1. **DATABASE_ANALYSIS.md** - Understand all tables
2. **ADMIN_CRUD_PLAN.md** - Detailed implementation steps
3. **035_SEED_DATA_README.md** - Understand test data
4. **PHASE_13_SUMMARY.md** - Overview of everything

### Code References
- Student CRUD: `web/app/dashboard/students/page.tsx`
- API patterns: `web/app/api/students/route.ts`
- Components: `web/components/` directory

### Database
- Local: `http://localhost:54323` (Supabase Studio)
- Schema: Check `supabase/migrations/` folder

## Questions to Ask Yourself

### Before Starting
- ✅ Is seed data loaded?
- ✅ Can I see 50 students in the dashboard?
- ✅ Do I understand the database schema?
- ✅ Have I read the ADMIN_CRUD_PLAN.md?

### While Building
- Am I following the student CRUD pattern?
- Does my API handle pagination?
- Does my API handle errors?
- Am I validating input?
- Do I have loading states?
- Are my filters working?

### Before Committing
- Does it work with seed data?
- Can I create a class?
- Can I edit a class?
- Can I delete a class?
- Do filters work?
- Does search work?
- Does export work?
- No console errors?
- No TypeScript errors?
- No lint warnings?

## Success Metrics

### Classes CRUD Complete When:
- ✅ Can list all 50 classes
- ✅ Can filter by grade/subject/teacher
- ✅ Can search by name
- ✅ Can create new class
- ✅ Can edit existing class
- ✅ Can archive class
- ✅ Can view class roster (enrolled students)
- ✅ Can export to CSV
- ✅ Bulk actions work
- ✅ No errors in console
- ✅ All tests pass

### Then Move to Assignments
Follow same checklist!

---

## Quick Command Reference

```bash
# Apply seed data
supabase db reset

# Start dev server
cd web && pnpm dev

# Check data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM classes;"

# Build and test
pnpm build && pnpm lint

# Commit
git add . && git commit -m "feat: classes CRUD" && git push
```

---

**Start with Priority 1 (Classes CRUD) and follow ADMIN_CRUD_PLAN.md step by step!**

**You have all the tools and data you need. Let's build! 🚀**
