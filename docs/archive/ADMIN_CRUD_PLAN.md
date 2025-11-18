# Admin CRUD Implementation Plan

## Overview
Build comprehensive admin interfaces for all database entities, following the proven patterns from the student CRUD system.

## Current Status
✅ **Phase 11 Completed**: Student CRUD with all 11 features
✅ **Phase 12 Completed**: Deployment fixes and database analysis
🔄 **Phase 13 Started**: Comprehensive seed data created

## Design Patterns (From Student CRUD)

### API Pattern
```typescript
// GET /api/admin/[entity]
// - Pagination (page, pageSize)
// - Filtering (multiple fields)
// - Sorting (field, direction)
// - Search (full-text)
// - Returns: { data, totalCount, page, pageSize }

// POST /api/admin/[entity]
// - Validation
// - Unique constraints
// - Audit logging
// - Returns: created entity

// PUT /api/admin/[entity]/[id]
// - Validation
// - Optimistic locking
// - Audit logging
// - Returns: updated entity

// DELETE /api/admin/[entity]/[id]
// - Soft delete (archive)
// - Cascade handling
// - Audit logging
// - Returns: success

// POST /api/admin/[entity]/bulk
// - Archive multiple
// - Export CSV
// - Bulk update status
```

### UI Pattern
```typescript
// List Page Components
// - DataTable with sorting
// - Filter panel (grade, status, date range, etc.)
// - Search bar (debounced)
// - Bulk action menu
// - Pagination controls
// - Export button
// - Create button

// Form Components
// - Modal or slide-over
// - Form validation (zod)
// - Error display
// - Loading states
// - Success toast
// - Confirmation for destructive actions
```

### Feature Checklist
- [ ] Advanced filters (3-5 fields)
- [ ] Full-text search
- [ ] Sorting (client-side and server-side)
- [ ] Pagination
- [ ] Create/Edit modal
- [ ] Delete with confirmation
- [ ] Bulk actions (archive, export)
- [ ] CSV export
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error handling
- [ ] Inline validation

## Priority 1: Classes CRUD (Week 2, Day 1-2)

### Database Schema (Existing)
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  grade_level VARCHAR(50),
  teacher_id UUID REFERENCES profiles(id),
  academic_year_id UUID REFERENCES academic_years(id),
  schedule JSONB, -- {"monday": "09:00-10:00", ...}
  room VARCHAR(50),
  capacity INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- active, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints
**File**: `web/app/api/admin/classes/route.ts`
```typescript
// GET /api/admin/classes?page=1&pageSize=20&gradeLevel=Grade 9&subject=Math&teacherId=xxx&status=active
// POST /api/admin/classes { name, subject, gradeLevel, teacherId, academicYearId, schedule, room, capacity }
```

**File**: `web/app/api/admin/classes/[id]/route.ts`
```typescript
// GET /api/admin/classes/[id]
// PUT /api/admin/classes/[id]
// DELETE /api/admin/classes/[id]
```

**File**: `web/app/api/admin/classes/bulk/route.ts`
```typescript
// POST /api/admin/classes/bulk { action: 'archive' | 'export', ids: [...] }
```

### UI Pages
**File**: `web/app/dashboard/admin/classes/page.tsx`
- DataTable with columns: Name, Subject, Grade, Teacher, Room, Capacity, Enrolled, Status
- Filters: Grade Level, Subject, Teacher, Academic Year, Status
- Search: By class name
- Actions: Create, Edit, Archive, View Roster, Export

**File**: `web/components/ClassFormModal.tsx`
- Fields: Name*, Subject*, Grade Level*, Teacher*, Academic Year*, Schedule*, Room, Capacity*
- Validation: Required fields, capacity > 0, no schedule conflicts
- Schedule Builder: Visual weekly schedule picker

**File**: `web/components/ClassFilters.tsx`
- Grade level dropdown
- Subject dropdown
- Teacher search/select
- Academic year select
- Status toggle

### Features
1. ✅ List all classes with filters
2. ✅ Search by name
3. ✅ Create new class with schedule
4. ✅ Edit class details
5. ✅ Archive class (soft delete)
6. ✅ View enrolled students
7. ✅ Export class list CSV
8. ✅ Bulk archive
9. ✅ Schedule conflict detection
10. ✅ Capacity warnings

### Test Cases
- Create class with valid data
- Create class with schedule conflict (warn)
- Edit class and update enrollments
- Archive class (check enrollment status)
- Filter by grade level
- Search by class name
- Export filtered results
- Bulk archive multiple classes

## Priority 2: Assignments CRUD (Week 2, Day 3-4)

### Database Schema (Existing)
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES assignment_categories(id),
  due_date DATE,
  max_points NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'active', -- active, draft, archived, graded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  weight NUMERIC(3,2), -- 0.20 for 20%
  description TEXT
);
```

### API Endpoints
**File**: `web/app/api/admin/assignments/route.ts`
```typescript
// GET /api/admin/assignments?classId=xxx&categoryId=xxx&status=active&dateRange=...
// POST /api/admin/assignments { classId, title, description, categoryId, dueDate, maxPoints }
```

**File**: `web/app/api/admin/assignments/[id]/route.ts`
```typescript
// GET /api/admin/assignments/[id]
// PUT /api/admin/assignments/[id]
// DELETE /api/admin/assignments/[id]
```

**File**: `web/app/api/admin/assignments/bulk/route.ts`
```typescript
// POST /api/admin/assignments/bulk { action: 'archive' | 'export' | 'duplicate', ids: [...] }
```

**File**: `web/app/api/admin/assignments/categories/route.ts`
```typescript
// GET /api/admin/assignments/categories
// POST /api/admin/assignments/categories { name, weight, description }
```

### UI Pages
**File**: `web/app/dashboard/admin/assignments/page.tsx`
- DataTable: Title, Class, Category, Due Date, Max Points, Submissions, Status
- Filters: Class, Category, Date Range, Status
- Search: By title
- Actions: Create, Edit, Delete, Duplicate, View Submissions, Export

**File**: `web/components/AssignmentFormModal.tsx`
- Fields: Title*, Class*, Category*, Description, Due Date*, Max Points*
- Rich text editor for description
- Category quick-create button
- Validation: Due date not in past, max points > 0

**File**: `web/components/AssignmentCalendarView.tsx`
- Calendar view of all assignments
- Click to edit
- Drag to reschedule
- Color-coded by category

**File**: `web/components/CategoryManagement.tsx`
- List categories with weights
- Add/edit/delete categories
- Weight must sum to 1.0 warning

### Features
1. ✅ List assignments with filters
2. ✅ Search by title
3. ✅ Create assignment with category
4. ✅ Edit assignment
5. ✅ Delete assignment
6. ✅ Duplicate assignment
7. ✅ Calendar view
8. ✅ Category management
9. ✅ Bulk import from CSV
10. ✅ Export assignments
11. ✅ View submissions
12. ✅ Template library

### Test Cases
- Create assignment with all fields
- Create assignment with past due date (error)
- Edit due date
- Delete assignment (check submissions)
- Filter by class and category
- Calendar view with multiple assignments
- Duplicate assignment to different class
- Bulk import 50 assignments from CSV
- Category weight validation

## Priority 3: Financial System Admin (Week 2, Day 5)

### Database Schema (Existing)
```sql
-- 10 tables: fee_types, student_accounts, invoices, invoice_items,
-- payments, payment_methods, payment_schedules, 
-- payment_schedule_installments, payment_allocations, fee_assignments
```

### API Endpoints
**File**: `web/app/api/admin/finance/fee-types/route.ts`
**File**: `web/app/api/admin/finance/invoices/route.ts`
**File**: `web/app/api/admin/finance/payments/route.ts`
**File**: `web/app/api/admin/finance/accounts/route.ts`

### UI Pages
**File**: `web/app/dashboard/admin/finance/page.tsx` - Dashboard overview
**File**: `web/app/dashboard/admin/finance/fee-types/page.tsx` - Fee management
**File**: `web/app/dashboard/admin/finance/invoices/page.tsx` - Invoice management
**File**: `web/app/dashboard/admin/finance/payments/page.tsx` - Payment recording
**File**: `web/app/dashboard/admin/finance/accounts/page.tsx` - Student accounts

### Features
1. ✅ Fee type CRUD
2. ✅ Generate invoices (single/bulk)
3. ✅ Record payments
4. ✅ View student balances
5. ✅ Payment plans
6. ✅ Overdue reports
7. ✅ Payment history
8. ✅ Export financial reports
9. ✅ Receipt generation
10. ✅ Refund processing

### Test Cases
- Create fee type
- Generate invoice for student
- Record full payment
- Record partial payment
- View student balance
- Generate overdue report
- Export all transactions
- Process refund

## Priority 4: Attendance Admin (Week 3, Day 1-2)

### Database Schema (Existing)
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL,
  status VARCHAR(20), -- present, absent, late, excused
  notes TEXT
);
```

### API Endpoints
**File**: `web/app/api/admin/attendance/route.ts`
**File**: `web/app/api/admin/attendance/batch/route.ts` - Mark entire class
**File**: `web/app/api/admin/attendance/reports/route.ts` - Reports

### UI Pages
**File**: `web/app/dashboard/admin/attendance/page.tsx`
- Date picker
- Class selector
- Student roster with checkboxes
- Quick actions: Mark all present, Mark all absent
- Batch save

**File**: `web/app/dashboard/admin/attendance/reports/page.tsx`
- Attendance rate by student
- Attendance rate by class
- Absence patterns
- Tardy reports
- Export

### Features
1. ✅ Mark attendance for class
2. ✅ Batch mark all present
3. ✅ Add absence notes
4. ✅ View attendance history
5. ✅ Attendance reports
6. ✅ Absence alerts
7. ✅ Export attendance
8. ✅ Attendance rate calculations

## Priority 5: Grades Admin (Week 3, Day 3-4)

### Database Schema (Existing)
```sql
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  assignment_id UUID REFERENCES assignments(id),
  submission_id UUID REFERENCES submissions(id),
  score NUMERIC(10,2),
  feedback TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ
);
```

### API Endpoints
**File**: `web/app/api/admin/grades/route.ts`
**File**: `web/app/api/admin/grades/spreadsheet/route.ts` - Batch entry
**File**: `web/app/api/admin/grades/reports/route.ts` - Report cards

### UI Pages
**File**: `web/app/dashboard/admin/grades/page.tsx`
- Class selector
- Assignment selector
- Spreadsheet view (students × assignments)
- Inline editing
- Auto-save

**File**: `web/app/dashboard/admin/grades/reports/page.tsx`
- Generate report cards
- Grade distribution
- Class averages
- Student progress tracking

### Features
1. ✅ Spreadsheet grade entry
2. ✅ Bulk grade import CSV
3. ✅ Grade calculations
4. ✅ Report card generation
5. ✅ Progress reports
6. ✅ Grade distribution charts
7. ✅ Export grades
8. ✅ GPA calculations

## Priority 6: Settings UI (Week 3, Day 5)

### Pages
**File**: `web/app/dashboard/admin/settings/page.tsx`
- School information
- Academic year management
- Grading scale configuration
- System settings
- User roles & permissions
- Email templates

### Features
1. ✅ School info CRUD
2. ✅ Academic year CRUD
3. ✅ Grading scale CRUD
4. ✅ System settings
5. ✅ Email templates
6. ✅ Role management

## Priority 7: Admin Dashboard (Week 4)

### Page
**File**: `web/app/dashboard/admin/page.tsx`

### Features
- Total students/teachers/classes
- Enrollment trends chart
- Attendance rate chart
- Financial summary
- Recent activity feed
- Quick actions
- Alerts (overdue payments, low attendance)

## Implementation Strategy

### Phase 1: Backend First (Day 1)
1. Create API routes
2. Add validation schemas
3. Implement error handling
4. Write API tests

### Phase 2: UI Components (Day 2)
1. Create list page
2. Add filters and search
3. Implement table with sorting
4. Add pagination

### Phase 3: Forms (Day 3)
1. Create form modal
2. Add validation
3. Implement create/edit
4. Add success feedback

### Phase 4: Advanced Features (Day 4)
1. Bulk actions
2. Export CSV
3. Special views (calendar, spreadsheet)
4. Reports

### Phase 5: Testing & Polish (Day 5)
1. Test all CRUD operations
2. Test with seed data
3. Fix bugs
4. Polish UI/UX
5. Document

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Zod for validation
- Proper error handling

### React
- Server components by default
- Client components when needed
- Proper loading states
- Error boundaries

### Supabase
- RLS policies for all tables
- Proper indexes
- Audit logging
- Soft deletes

### UI/UX
- Consistent with existing design
- Toast notifications
- Confirmation modals
- Loading spinners
- Empty states
- Error messages

## Testing Requirements

### Unit Tests
- Validation functions
- Utility functions
- Data transformations

### Integration Tests
- API endpoints
- Database queries
- RLS policies

### E2E Tests
- Create entity
- Edit entity
- Delete entity
- Bulk actions
- Filters and search

## Documentation Requirements

### API Documentation
- Endpoint descriptions
- Request/response examples
- Error codes
- Rate limits

### User Documentation
- How to guides
- Screenshots
- Video tutorials
- FAQs

## Success Criteria

### Functional
- All CRUD operations work
- Filters and search work
- Bulk actions work
- Export works
- No data loss
- Proper error handling

### Performance
- List page loads < 2s
- Search responds < 500ms
- Bulk operations complete < 10s
- Export generates < 30s

### Quality
- No console errors
- No TypeScript errors
- No ESLint warnings
- Passes all tests
- Proper loading states
- Good error messages

## Timeline Summary

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| 2 | 1-2 | Classes CRUD | API + UI complete |
| 2 | 3-4 | Assignments CRUD | API + UI complete |
| 2 | 5 | Financial Admin | Core features done |
| 3 | 1-2 | Attendance Admin | Batch marking working |
| 3 | 3-4 | Grades Admin | Spreadsheet entry working |
| 3 | 5 | Settings UI | Basic settings done |
| 4 | 1-5 | Admin Dashboard + Polish | Complete system |

## Next Immediate Steps

1. ✅ Apply seed data migration
2. ✅ Test student CRUD with new data
3. 🔄 Start Classes CRUD API
4. 🔄 Build Classes UI
5. ⏳ Continue with Assignments
6. ⏳ Continue with Financial System

---

**Created**: 2024-11-17  
**Status**: Ready to implement  
**Priority**: Classes → Assignments → Financial → Attendance → Grades → Settings → Dashboard
