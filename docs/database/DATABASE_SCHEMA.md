# Database Schema Reference - ACTUAL SUPABASE DATABASE

**Last Updated**: December 1, 2025  
**Source**: Real Supabase database schema provided by user

This document is the **single source of truth** for the database schema. All API code must reference these exact table names and structures.

---

## 🎯 Quick Reference

### Table Names (Alphabetical)
- `academic_years`
- `assignment_categories`
- `assignments`
- `attendance` ⚠️ **NOT** `attendance_records`
- `attendance_reports`
- `audit_logs`
- `classes`
- `courses`
- `enrollments`
- `fee_types`
- `grades`
- `grading_scales`
- `guardians`
- `import_errors`
- `import_logs`
- `lessons`
- `notifications`
- `payment_methods`
- `profiles` ⚠️ **Single table for all users** (NO `students` or `teachers` tables)
- `qr_codes`
- `school_settings`
- `subjects`

---

## 🔴 CRITICAL ISSUES TO FIX

### ❌ Issue 1: Wrong Table Name - `attendance_records`
**Problem**: Some APIs use `attendance_records` but the actual table is `attendance`.

**Status**:
- ✅ Fixed: `web/app/api/admin/attendance/[id]/route.ts`
- ⚠️ Check: All other API files

**Fix**:
```typescript
// WRONG ❌
.from('attendance_records')

// CORRECT ✅
.from('attendance')
```

### ❌ Issue 2: Non-existent `students` and `teachers` Tables
**Problem**: APIs query `students` and `teachers` tables that don't exist.

**Reality**: Use `profiles` table with `role` filter.

**Fix**:
```typescript
// WRONG ❌
.from('students')
.from('teachers')

// CORRECT ✅
.from('profiles').eq('role', 'student')
.from('profiles').eq('role', 'teacher')
.from('profiles').eq('role', 'admin')
```

### ❌ Issue 3: Missing Field References
**Problem**: APIs may reference fields that don't exist in actual schema.

**Examples**:
- `classes` table has NO `code` field
- `classes` table has NO `academic_year_id` field
- `enrollments` table has NO `created_at` field
- `attendance` has `half_day` status (not just present/absent/late/excused)

---

## 📊 Complete Table Schemas

### 1. profiles 👥
**THE main user table - contains ALL users (students, teachers, admins)**

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,                    -- Links to auth.users
  first_name text,
  last_name text,
  full_name text,
  email text,
  date_of_birth date,
  phone text,
  address text,
  emergency_contact text,
  role text CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text, 'student'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  student_id text,                 -- Legacy field
  grade_level text,                -- For students
  gender character varying,
  enrollment_date date DEFAULT CURRENT_DATE,
  status character varying DEFAULT 'active'::character varying,
  photo_url text,
  department text,                 -- For teachers/admin
  is_active boolean DEFAULT true,
  created_by uuid,
  notes text,
  student_code character varying UNIQUE,  -- Unique student identifier
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Key Points**:
- ✅ **role** field: `'admin'`, `'teacher'`, or `'student'`
- ✅ **student_code**: Unique identifier for students (use this, not student_id)
- ✅ Has both `first_name`/`last_name` AND `full_name`
- ✅ **status** field for active/inactive users
- ⚠️ NO separate `students` or `teachers` tables exist

**Query Examples**:
```typescript
// Get all students
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student');

// Get all teachers
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'teacher');

// Get student by code
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('student_code', 'STU001');
```

---

### 2. classes 🏫

```sql
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
```

**Key Points**:
- ⚠️ **NO** `code` field exists
- ⚠️ **NO** `academic_year_id` field exists
- ✅ Only fields: id, name, teacher_id, created_at

---

### 3. enrollments 📝

```sql
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text, 'withdrawn'::text])),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
```

**Key Points**:
- ✅ Status values: `'active'`, `'inactive'`, `'completed'`, `'withdrawn'`
- ⚠️ **NO** `created_at` field exists
- ⚠️ **NO** foreign key constraint to classes (data integrity warning)

---

### 4. attendance 📅
**⚠️ CRITICAL: Table name is `attendance`, NOT `attendance_records`**

```sql
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  date date NOT NULL,
  status text CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text, 'half_day'::text])),
  check_in_time time without time zone,
  check_out_time time without time zone,
  notes text,
  marked_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
);
```

**Key Points**:
- ✅ Status values: `'present'`, `'absent'`, `'late'`, `'excused'`, **`'half_day'`**
- ✅ Has `check_in_time` and `check_out_time` (time without time zone)
- ✅ Has `marked_by` field for audit trail
- ⚠️ **NO** foreign key constraint to classes (data integrity warning)

---

### 5. attendance_reports 📊

```sql
CREATE TABLE public.attendance_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_type character varying NOT NULL,
  class_id uuid,
  student_id uuid,
  date_from date NOT NULL,
  date_to date NOT NULL,
  total_days integer,
  present_count integer,
  absent_count integer,
  late_count integer,
  excused_count integer,
  attendance_rate numeric,
  report_data jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  generated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_reports_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_reports_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT attendance_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT attendance_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.profiles(id)
);
```

---

### 6. assignment_categories 📂

```sql
CREATE TABLE public.assignment_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  weight numeric DEFAULT 0,
  class_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assignment_categories_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_categories_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
```

---

### 7. assignments 📄

```sql
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  due_date date,
  max_points numeric DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assignments_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.assignment_categories(id)
);
```

---

### 8. grades 📝

```sql
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  score numeric,
  feedback text,
  graded_at timestamp with time zone,
  graded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grades_pkey PRIMARY KEY (id),
  CONSTRAINT grades_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT grades_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id)
);
```

---

### 9. guardians 👨‍👩‍👧‍👦

```sql
CREATE TABLE public.guardians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  name character varying NOT NULL,
  relationship character varying CHECK (relationship::text = ANY (ARRAY['father'::character varying, 'mother'::character varying, 'guardian'::character varying, 'grandparent'::character varying, 'sibling'::character varying, 'other'::character varying]::text[])),
  phone character varying,
  email character varying,
  address text,
  is_primary_contact boolean DEFAULT false,
  is_emergency_contact boolean DEFAULT false,
  occupation character varying,
  workplace character varying,
  work_phone character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
```

---

### 10. courses 📚

```sql
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject_id uuid,
  teacher_id uuid,
  academic_year_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT courses_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
```

---

### 11. subjects 📖

```sql
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
```

---

### 12. lessons 📋

```sql
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  lesson_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
```

---

### 13. academic_years 📆

```sql
CREATE TABLE public.academic_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT academic_years_pkey PRIMARY KEY (id)
);
```

---

### 14. grading_scales 📊

```sql
CREATE TABLE public.grading_scales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  scale jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grading_scales_pkey PRIMARY KEY (id)
);
```

---

### 15. fee_types 💰

```sql
CREATE TABLE public.fee_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  academic_year_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fee_types_pkey PRIMARY KEY (id),
  CONSTRAINT fee_types_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
```

---

### 16. payment_methods 💳

```sql
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);
```

---

### 17. qr_codes 📱

```sql
CREATE TABLE public.qr_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  class_id uuid,
  token text NOT NULL UNIQUE,
  valid_until timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT qr_codes_pkey PRIMARY KEY (id),
  CONSTRAINT qr_codes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
```

---

### 18. notifications 🔔

```sql
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])),
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

### 19. audit_logs 📝

```sql
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text NOT NULL,
  user_role text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  changes jsonb,
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
```

---

### 20. import_logs 📥

```sql
CREATE TABLE public.import_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  imported_by uuid NOT NULL,
  import_type character varying NOT NULL,
  file_name character varying,
  file_size integer,
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  error_summary text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT import_logs_pkey PRIMARY KEY (id),
  CONSTRAINT import_logs_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES public.profiles(id)
);
```

---

### 21. import_errors ❌

```sql
CREATE TABLE public.import_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  import_log_id uuid NOT NULL,
  row_number integer NOT NULL,
  field_name character varying,
  error_type character varying,
  error_message text NOT NULL,
  row_data jsonb,
  severity character varying DEFAULT 'error'::character varying CHECK (severity::text = ANY (ARRAY['error'::character varying, 'warning'::character varying, 'info'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT import_errors_pkey PRIMARY KEY (id),
  CONSTRAINT import_errors_import_log_id_fkey FOREIGN KEY (import_log_id) REFERENCES public.import_logs(id)
);
```

---

### 22. school_settings ⚙️

```sql
CREATE TABLE public.school_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT school_settings_pkey PRIMARY KEY (id)
);
```

---

## 🔧 Best Practices

### 1. Admin Operations - Use Service Client
```typescript
import { createServiceClient } from '@/lib/supabase/server';

// For admin APIs that need to bypass RLS
export async function GET() {
  const supabase = createServiceClient();
  // Admin operations...
}
```

### 2. User-Specific Operations - Use Request Client
```typescript
import { createClientFromRequest } from '@/lib/supabase/server';

// For user-specific data with RLS
export async function GET(request: Request) {
  const supabase = createClientFromRequest(request);
  // User-specific operations...
}
```

### 3. Query Students
```typescript
// ✅ CORRECT
const { data: students } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'student')
  .eq('is_active', true);
```

### 4. Query Teachers
```typescript
// ✅ CORRECT
const { data: teachers } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'teacher')
  .eq('is_active', true);
```

### 5. Join with Profiles
```typescript
// ✅ CORRECT - Join attendance with student info
const { data } = await supabase
  .from('attendance')
  .select(`
    *,
    student:profiles!attendance_student_id_fkey(id, full_name, email, student_code),
    marked_by_user:profiles!attendance_marked_by_fkey(full_name)
  `)
  .eq('id', attendanceId);
```

---

## ✅ Verification Checklist

Before deploying any API changes:

- [ ] Verify table names match this document exactly
- [ ] Check that `attendance` (not `attendance_records`) is used
- [ ] Confirm `profiles` table is used (not `students` or `teachers`)
- [ ] Ensure correct Supabase client is used (service vs request)
- [ ] Verify field names exist in actual schema
- [ ] Test foreign key relationships work
- [ ] Check status/role enum values are valid
- [ ] Confirm timestamp fields use correct types

---

## 📌 Common Mistakes to Avoid

1. ❌ Using `attendance_records` → ✅ Use `attendance`
2. ❌ Using `students` table → ✅ Use `profiles` with `role='student'`
3. ❌ Using `teachers` table → ✅ Use `profiles` with `role='teacher'`
4. ❌ Assuming `classes.code` exists → ✅ It doesn't exist
5. ❌ Assuming `enrollments.created_at` exists → ✅ It doesn't exist
6. ❌ Missing `half_day` status → ✅ Attendance can be `'half_day'`
7. ❌ Using wrong client for admin ops → ✅ Use `createServiceClient()`

---

**Last Sync**: December 1, 2025  
**Maintainer**: Development Team  
**Status**: ✅ Verified against production Supabase database
