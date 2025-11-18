# Admin System Development Checklist

## Phase 13: Database Analysis & Seed Data ✅ COMPLETE

- [x] Analyze all 34 database migrations
- [x] Document 27 database tables
- [x] Identify critical issues (missing CRUD APIs)
- [x] Create comprehensive seed data (Part 1: Users)
- [x] Create comprehensive seed data (Part 2: Classes, Relationships)
- [x] Create comprehensive seed data (Part 3: Assignments, Grades, Financials)
- [x] Write seed data documentation
- [x] Create 4-week implementation plan
- [x] Write quick start guide
- [x] Create this checklist

**Status**: ✅ All planning and seed data complete  
**Next**: Apply seed data and start Classes CRUD

---

## Phase 14: Apply Seed Data & Verify

### Apply Migration
- [ ] Choose deployment method (CLI / Manual / Dashboard)
- [ ] Apply Part 1 (Users & Academic Setup)
- [ ] Apply Part 2 (Classes, Guardians, Enrollments)
- [ ] Apply Part 3 (Assignments, Attendance, Grades, Financials)
- [ ] Verify no SQL errors during application

### Validate Data
- [ ] Run record count query (should show 50 students, 50 classes, etc.)
- [ ] Check foreign key relationships
- [ ] Verify student accounts have correct balances
- [ ] Confirm enrollment counts match expectations
- [ ] Review attendance data (should have ~1000 records)
- [ ] Check invoice/payment data

### Test Existing Features
- [ ] Browse students page - see 50 students
- [ ] Filter students by grade level (Grade 1, 6, 9, 12)
- [ ] Search for student by name
- [ ] View student profile with guardian info
- [ ] Test enrollment manager (should show classes)
- [ ] Export students to CSV
- [ ] Verify bulk actions work
- [ ] Check photo upload functionality

**Status**: ⏳ Not started  
**Estimated Time**: 1-2 hours  
**Next**: Start Classes CRUD development

---

## Phase 15: Classes CRUD (Week 2, Day 1-2)

### Backend API Development (Day 1 Morning)

#### Main API Route
**File**: `web/app/api/admin/classes/route.ts`
- [ ] Create file structure
- [ ] Implement GET (list classes)
  - [ ] Add pagination (page, pageSize)
  - [ ] Add filters (gradeLevel, subject, teacherId, academicYearId, status)
  - [ ] Add search (by class name)
  - [ ] Add sorting (name, gradeLevel, subject)
  - [ ] Include teacher info (join profiles)
  - [ ] Include enrollment count
  - [ ] Return format: `{ data: Class[], totalCount: number }`
- [ ] Implement POST (create class)
  - [ ] Validate input (Zod schema)
  - [ ] Check for schedule conflicts
  - [ ] Check capacity > 0
  - [ ] Create audit log
  - [ ] Return created class
- [ ] Add error handling
- [ ] Add TypeScript types

#### Single Class API
**File**: `web/app/api/admin/classes/[id]/route.ts`
- [ ] Create file structure
- [ ] Implement GET (single class)
  - [ ] Include teacher info
  - [ ] Include enrolled students list
  - [ ] Include enrollment count
- [ ] Implement PUT (update class)
  - [ ] Validate input
  - [ ] Check for schedule conflicts
  - [ ] Update audit log
  - [ ] Return updated class
- [ ] Implement DELETE (archive class)
  - [ ] Soft delete (set status = 'archived')
  - [ ] Update enrollments if needed
  - [ ] Create audit log
  - [ ] Return success
- [ ] Add error handling

#### Bulk Actions API
**File**: `web/app/api/admin/classes/bulk/route.ts`
- [ ] Create file structure
- [ ] Implement bulk archive
- [ ] Implement bulk export (CSV)
- [ ] Add validation (check IDs exist)
- [ ] Add error handling

### Frontend Development (Day 1 Afternoon + Day 2)

#### List Page
**File**: `web/app/dashboard/admin/classes/page.tsx`
- [ ] Create page structure
- [ ] Add DataTable component
  - [ ] Columns: Name, Subject, Grade, Teacher, Room, Capacity, Enrolled, Status
  - [ ] Sortable columns
  - [ ] Row actions (edit, archive, view roster)
- [ ] Add search bar (debounced)
- [ ] Add pagination controls
- [ ] Add "Create Class" button
- [ ] Add bulk actions dropdown
- [ ] Add export button
- [ ] Add loading skeleton
- [ ] Add empty state
- [ ] Handle errors with toast

#### Filters Component
**File**: `web/components/ClassFilters.tsx`
- [ ] Create component structure
- [ ] Add grade level dropdown (Grade 1-12)
- [ ] Add subject dropdown (Math, English, Science, etc.)
- [ ] Add teacher select (searchable)
- [ ] Add academic year select
- [ ] Add status toggle (active/archived)
- [ ] Add "Clear filters" button
- [ ] Handle filter changes
- [ ] Save filter state

#### Form Modal
**File**: `web/components/ClassFormModal.tsx`
- [ ] Create modal component
- [ ] Add form fields:
  - [ ] Name* (text input)
  - [ ] Subject* (dropdown)
  - [ ] Grade Level* (dropdown)
  - [ ] Teacher* (searchable select)
  - [ ] Academic Year* (dropdown)
  - [ ] Schedule* (JSON editor or schedule builder)
  - [ ] Room (text input)
  - [ ] Capacity* (number input)
- [ ] Add Zod validation schema
- [ ] Add error display
- [ ] Add loading state on submit
- [ ] Handle create mode
- [ ] Handle edit mode
- [ ] Show success toast
- [ ] Close modal on success

#### Schedule Builder (Optional Enhancement)
**File**: `web/components/ScheduleBuilder.tsx`
- [ ] Create visual schedule component
- [ ] Show days of week (Mon-Fri)
- [ ] Time slot selection
- [ ] Multiple time slots per day
- [ ] Format output as JSON
- [ ] Validate no overlaps
- [ ] Show conflicts

### Testing (Day 2 Afternoon)
- [ ] Create new class with valid data
- [ ] Create class with all fields
- [ ] Edit existing class
- [ ] Archive class
- [ ] Filter by grade level
- [ ] Filter by subject
- [ ] Filter by teacher
- [ ] Search by class name
- [ ] Sort by different columns
- [ ] View class roster (enrolled students)
- [ ] Export to CSV
- [ ] Bulk archive multiple classes
- [ ] Test pagination (with 50 classes)
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test validation errors

### Documentation
- [ ] Add API documentation comments
- [ ] Update README if needed
- [ ] Document schedule JSON format
- [ ] Add inline code comments

### Git Commit
- [ ] Review all changes
- [ ] Run `pnpm build` (no errors)
- [ ] Run `pnpm lint` (no warnings)
- [ ] Stage all files
- [ ] Write descriptive commit message
- [ ] Push to repository
- [ ] Verify deployment succeeds

**Status**: ⏳ Not started  
**Estimated Time**: 2 days  
**Next**: Assignments CRUD

---

## Phase 16: Assignments CRUD (Week 2, Day 3-4)

### Backend API Development

#### Main API Route
**File**: `web/app/api/admin/assignments/route.ts`
- [ ] Implement GET (list assignments)
  - [ ] Add filters (classId, categoryId, status, dateRange)
  - [ ] Add pagination
  - [ ] Add search
  - [ ] Include class info
  - [ ] Include category info
  - [ ] Include submission count
- [ ] Implement POST (create assignment)
  - [ ] Validate due date not in past
  - [ ] Validate max points > 0
  - [ ] Create audit log

#### Single Assignment API
**File**: `web/app/api/admin/assignments/[id]/route.ts`
- [ ] Implement GET (single assignment)
- [ ] Implement PUT (update assignment)
- [ ] Implement DELETE (delete assignment)

#### Bulk Actions API
**File**: `web/app/api/admin/assignments/bulk/route.ts`
- [ ] Implement bulk archive
- [ ] Implement bulk duplicate
- [ ] Implement bulk export

#### Categories API
**File**: `web/app/api/admin/assignments/categories/route.ts`
- [ ] Implement GET (list categories)
- [ ] Implement POST (create category)
- [ ] Implement PUT (update category)
- [ ] Implement DELETE (delete category)

### Frontend Development

#### List Page
**File**: `web/app/dashboard/admin/assignments/page.tsx`
- [ ] Create page structure
- [ ] Add DataTable (Title, Class, Category, Due Date, Max Points, Submissions, Status)
- [ ] Add filters panel
- [ ] Add search bar
- [ ] Add pagination
- [ ] Add create button
- [ ] Add view toggle (table/calendar)

#### Filters Component
**File**: `web/components/AssignmentFilters.tsx`
- [ ] Add class filter
- [ ] Add category filter
- [ ] Add date range picker
- [ ] Add status filter

#### Form Modal
**File**: `web/components/AssignmentFormModal.tsx`
- [ ] Add form fields (Title, Class, Category, Description, Due Date, Max Points)
- [ ] Add rich text editor for description
- [ ] Add category quick-create
- [ ] Add validation
- [ ] Handle create/edit modes

#### Calendar View
**File**: `web/components/AssignmentCalendarView.tsx`
- [ ] Create calendar component
- [ ] Show assignments by due date
- [ ] Color-code by category
- [ ] Click to view/edit
- [ ] Drag to reschedule (optional)

#### Category Management
**File**: `web/components/CategoryManagement.tsx`
- [ ] List categories with weights
- [ ] Add category form
- [ ] Edit category
- [ ] Delete category (with warning if used)
- [ ] Validate weights sum to 1.0

### Testing
- [ ] Create assignment with all fields
- [ ] Create assignment with rich description
- [ ] Edit assignment
- [ ] Delete assignment (check submissions)
- [ ] Duplicate assignment
- [ ] Filter by class
- [ ] Filter by category
- [ ] Filter by date range
- [ ] Search by title
- [ ] View calendar view
- [ ] Create new category
- [ ] Edit category
- [ ] Bulk actions
- [ ] Export to CSV

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 2 days  
**Next**: Financial Admin

---

## Phase 17: Financial System Admin (Week 2, Day 5)

### Backend API Development

#### Fee Types API
**File**: `web/app/api/admin/finance/fee-types/route.ts`
- [ ] Implement CRUD for fee types
- [ ] Add validation

#### Invoices API
**File**: `web/app/api/admin/finance/invoices/route.ts`
- [ ] Implement GET (list invoices)
- [ ] Implement POST (create invoice)
- [ ] Implement GET single invoice
- [ ] Implement PUT (update invoice)

#### Invoice Generation
**File**: `web/app/api/admin/finance/invoices/generate/route.ts`
- [ ] Generate invoice for single student
- [ ] Bulk generate for multiple students
- [ ] Auto-calculate amounts from fee types

#### Payments API
**File**: `web/app/api/admin/finance/payments/route.ts`
- [ ] Implement GET (list payments)
- [ ] Implement POST (record payment)
- [ ] Update invoice status
- [ ] Update student account balance

#### Accounts API
**File**: `web/app/api/admin/finance/accounts/route.ts`
- [ ] Implement GET (list student accounts)
- [ ] Include balance calculations
- [ ] Include payment history
- [ ] Include outstanding invoices

### Frontend Development

#### Dashboard Page
**File**: `web/app/dashboard/admin/finance/page.tsx`
- [ ] Total revenue widget
- [ ] Outstanding balance widget
- [ ] Recent payments list
- [ ] Overdue invoices list
- [ ] Quick actions

#### Fee Types Page
**File**: `web/app/dashboard/admin/finance/fee-types/page.tsx`
- [ ] List fee types
- [ ] Create/edit form
- [ ] Active/inactive toggle

#### Invoices Page
**File**: `web/app/dashboard/admin/finance/invoices/page.tsx`
- [ ] List invoices
- [ ] Filters (status, student, date range)
- [ ] Generate invoice button
- [ ] View invoice details
- [ ] Print invoice

#### Payments Page
**File**: `web/app/dashboard/admin/finance/payments/page.tsx`
- [ ] List payments
- [ ] Record payment form
- [ ] Payment method selection
- [ ] Receipt generation

#### Student Accounts Page
**File**: `web/app/dashboard/admin/finance/accounts/page.tsx`
- [ ] List student accounts
- [ ] Balance column
- [ ] View payment history
- [ ] View outstanding invoices
- [ ] Payment plan management

### Testing
- [ ] Create fee type
- [ ] Generate invoice for student
- [ ] Bulk generate invoices
- [ ] Record full payment
- [ ] Record partial payment
- [ ] View student balance
- [ ] Generate overdue report
- [ ] Export transactions
- [ ] Print invoice
- [ ] Generate receipt

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 1 day  
**Next**: Attendance Admin

---

## Phase 18: Attendance Admin (Week 3, Day 1-2)

### Backend API Development

#### Attendance API
**File**: `web/app/api/admin/attendance/route.ts`
- [ ] Implement GET (list attendance records)
- [ ] Implement POST (create attendance)
- [ ] Implement PUT (update attendance)

#### Batch Marking API
**File**: `web/app/api/admin/attendance/batch/route.ts`
- [ ] Mark attendance for entire class
- [ ] Quick actions (mark all present, mark all absent)

#### Reports API
**File**: `web/app/api/admin/attendance/reports/route.ts`
- [ ] Attendance rate by student
- [ ] Attendance rate by class
- [ ] Absence patterns
- [ ] Tardy reports

### Frontend Development

#### Attendance Page
**File**: `web/app/dashboard/admin/attendance/page.tsx`
- [ ] Date picker
- [ ] Class selector
- [ ] Student roster with checkboxes
- [ ] Quick actions (mark all present/absent)
- [ ] Notes field for absences
- [ ] Batch save button

#### Reports Page
**File**: `web/app/dashboard/admin/attendance/reports/page.tsx`
- [ ] Attendance rate charts
- [ ] Student list with rates
- [ ] Class list with rates
- [ ] Export button

### Testing
- [ ] Mark attendance for entire class
- [ ] Mark all present
- [ ] Mark specific students absent
- [ ] Add absence notes
- [ ] View attendance history
- [ ] Generate reports
- [ ] Export attendance data

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 2 days  
**Next**: Grades Admin

---

## Phase 19: Grades Admin (Week 3, Day 3-4)

### Backend API Development

#### Grades API
**File**: `web/app/api/admin/grades/route.ts`
- [ ] Implement GET (list grades)
- [ ] Implement POST (create grade)
- [ ] Implement PUT (update grade)

#### Spreadsheet API
**File**: `web/app/api/admin/grades/spreadsheet/route.ts`
- [ ] Batch grade entry
- [ ] Get grades for class × assignment
- [ ] Save multiple grades at once

#### Reports API
**File**: `web/app/api/admin/grades/reports/route.ts`
- [ ] Generate report cards
- [ ] Grade distribution
- [ ] Class averages
- [ ] Student progress

### Frontend Development

#### Grades Page
**File**: `web/app/dashboard/admin/grades/page.tsx`
- [ ] Class selector
- [ ] Assignment selector
- [ ] Spreadsheet view (students × assignments)
- [ ] Inline editing
- [ ] Auto-save
- [ ] Grade calculations

#### Reports Page
**File**: `web/app/dashboard/admin/grades/reports/page.tsx`
- [ ] Report card generator
- [ ] Grade distribution charts
- [ ] Class average widgets
- [ ] Student progress tracking

### Testing
- [ ] Enter grades in spreadsheet
- [ ] Bulk import grades from CSV
- [ ] Calculate weighted averages
- [ ] Generate report card
- [ ] View grade distribution
- [ ] Export grades
- [ ] Calculate GPA

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 2 days  
**Next**: Settings UI

---

## Phase 20: Settings UI (Week 3, Day 5)

### Backend API Development

#### Settings API
**File**: `web/app/api/admin/settings/route.ts`
- [ ] Implement GET (get all settings)
- [ ] Implement PUT (update settings)

#### Academic Years API
**File**: `web/app/api/admin/settings/academic-years/route.ts`
- [ ] Implement CRUD for academic years

#### Grading Scales API
**File**: `web/app/api/admin/settings/grading-scales/route.ts`
- [ ] Implement CRUD for grading scales

### Frontend Development

#### Settings Page
**File**: `web/app/dashboard/admin/settings/page.tsx`
- [ ] School information section
- [ ] Academic years section
- [ ] Grading scales section
- [ ] System settings section
- [ ] Email templates section

### Testing
- [ ] Update school info
- [ ] Create academic year
- [ ] Edit academic year
- [ ] Create grading scale
- [ ] Edit grading scale
- [ ] Update system settings

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 1 day  
**Next**: Admin Dashboard

---

## Phase 21: Admin Dashboard (Week 4)

### Backend API Development

#### Analytics API
**File**: `web/app/api/admin/analytics/route.ts`
- [ ] Total counts (students, teachers, classes)
- [ ] Enrollment trends
- [ ] Attendance trends
- [ ] Financial summary
- [ ] Recent activity

### Frontend Development

#### Dashboard Page
**File**: `web/app/dashboard/admin/page.tsx`
- [ ] Summary widgets (students, teachers, classes, revenue)
- [ ] Enrollment trends chart
- [ ] Attendance rate chart
- [ ] Financial summary widget
- [ ] Recent activity feed
- [ ] Quick actions menu
- [ ] Alerts (overdue payments, low attendance)

### Testing
- [ ] View all widgets
- [ ] Check all data accurate
- [ ] Test quick actions
- [ ] Verify charts render
- [ ] Test date range filters

### Git Commit
- [ ] Review all changes
- [ ] Build and lint
- [ ] Commit and push

**Status**: ⏳ Not started  
**Estimated Time**: 3-5 days  
**Next**: Final testing and polish

---

## Phase 22: Final Testing & Polish (Week 4, Final Days)

### Comprehensive Testing
- [ ] Test all CRUD operations
- [ ] Test all filters and search
- [ ] Test all bulk actions
- [ ] Test all exports
- [ ] Test all reports
- [ ] Test navigation between pages
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test with different user roles
- [ ] Test on mobile devices

### Performance Testing
- [ ] Check page load times
- [ ] Check search response times
- [ ] Check bulk operation times
- [ ] Check export generation times
- [ ] Optimize slow queries

### Bug Fixes
- [ ] Fix any discovered bugs
- [ ] Address any edge cases
- [ ] Handle error scenarios
- [ ] Improve error messages

### UI/UX Polish
- [ ] Consistent styling across pages
- [ ] Proper spacing and alignment
- [ ] Smooth transitions
- [ ] Clear loading indicators
- [ ] Helpful empty states
- [ ] Good error states

### Documentation
- [ ] Update README
- [ ] Document all APIs
- [ ] Create user guides
- [ ] Add inline help text
- [ ] Write FAQs

### Final Deployment
- [ ] Run full build
- [ ] Run all tests
- [ ] Fix any warnings
- [ ] Create production build
- [ ] Deploy to production
- [ ] Smoke test production
- [ ] Monitor for errors

**Status**: ⏳ Not started  
**Estimated Time**: 2-3 days  
**Next**: Done!

---

## Summary Progress

### Phases Complete
- [x] Phase 13: Database Analysis & Seed Data ✅

### Phases In Progress
- [ ] Phase 14: Apply Seed Data & Verify ⏳

### Phases Pending
- [ ] Phase 15: Classes CRUD
- [ ] Phase 16: Assignments CRUD
- [ ] Phase 17: Financial Admin
- [ ] Phase 18: Attendance Admin
- [ ] Phase 19: Grades Admin
- [ ] Phase 20: Settings UI
- [ ] Phase 21: Admin Dashboard
- [ ] Phase 22: Final Testing & Polish

### Overall Completion
**Phase 13**: ✅ 100% Complete  
**Phases 14-22**: ⏳ 0% Complete  
**Total Project**: ~11% Complete (Phase 13 done, 8 phases remain)

---

**Last Updated**: 2024-11-17  
**Current Phase**: Phase 13 Complete → Ready to start Phase 14  
**Next Action**: Apply seed data migration
