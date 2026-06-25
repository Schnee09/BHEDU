# Live Database Schema Audit & Optimization Report

> **Generated on:** 2026-06-14  
> **Scope:** Full Live Supabase Database schema analysis (58 tables/views processed).  

## 📊 Overview

The Supabase database consists of **58** tables and views. We have analyzed columns, relationships, and structural design.

### Table Classifications

#### Core Profiles & Auth
- `profiles` (36 columns)
- `student_profiles` (13 columns)
- `teacher_profiles` (13 columns)
- `tutors` (11 columns)
- `parent_student_links` (16 columns)
- `user_permissions` (8 columns)
- `permission_definitions` (9 columns)
- `user_invitations` (11 columns)
- `role_permissions` (4 columns)
- `role_permission_overrides` (8 columns)

#### Academics & Classes
- `academic_years` (7 columns)
- `semesters` (11 columns)
- `courses` (18 columns)
- `classes` (19 columns)
- `subjects` (11 columns)
- `enrollments` (9 columns)
- `attendance` (13 columns)
- `grades` (16 columns)
- `timetable_slots` (16 columns)
- `weekly_notes` (6 columns)
- `calendar_events` (15 columns)
- `teacher_subjects` (6 columns)
- `evaluation_types` (7 columns)
- `student_conducts` (10 columns)
- `student_notes` (6 columns)
- `student_documents` (9 columns)

#### Finance System
- `tuition_config` (8 columns)
- `fee_types` (8 columns)
- `fee_assignments` (9 columns)
- `invoices` (13 columns)
- `invoice_items` (8 columns)
- `payments` (12 columns)
- `payment_allocations` (6 columns)
- `payment_schedules` (8 columns)
- `payment_schedule_installments` (7 columns)
- `student_accounts` (10 columns)
- `payment_methods` (8 columns)

#### System & Auditing
- `settings` (9 columns)
- `school_settings` (6 columns)
- `audit_logs` (11 columns)
- `permission_audit_logs` (12 columns)
- `notifications` (7 columns)
- `qr_codes` (6 columns)
- `import_logs` (16 columns)
- `import_errors` (9 columns)

#### Database Views
- `v_active_classes` (21 columns)
- `v_active_profiles` (34 columns)
- `v_active_students` (36 columns)
- `v_teacher_subjects` (8 columns)
- `all_teachers` (13 columns)
- `class_statistics` (6 columns)
- `student_performance_summary` (7 columns)
- `attendance_reports` (16 columns)
- `teacher_workload` (5 columns)

## 🔍 Core Relationship & Query Optimization Analysis

### 1. Owner Dashboard & Class-Subject Relationships
- **Issue:** Previously, queries in `DashboardRepository.ts` joined `subject:subjects` directly from the `classes` table. However, the `classes` table schema shows it does not have a `subject_id` column. Instead, it has a `course_id` pointing to the `courses` table, which then points to the `subjects` table.
- **Fix Applied:** Changed class queries to select `course:courses(name)` instead of `subject:subjects(name)` and mapped the name from the course.

### 2. Student Dashboard & Assignment-Subject Relationships
- **Issue:** The assignments query in `DashboardRepository.ts` attempted to select `subject:subjects(name, code)` directly from `assignments`. Our live schema audit reveals that the `assignments` table only contains a `class_id` and `category_id`, with no direct `subject_id` relationship.
- **Fix Applied:** Changed the assignments select structure to go through the nested relationship: `class:classes(course:courses(subject:subjects(name, code)))` and updated mapping variables accordingly.

### 3. Recommended Performance Indexes
Based on foreign keys and search query patterns, the following indexes are highly recommended (and should be executed directly in the Supabase SQL Editor if not already present):

```sql
-- Optimization for classes -> courses -> subjects joins
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON public.courses(subject_id);

-- Optimization for student/teacher profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code) WHERE student_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_code ON public.profiles(teacher_code) WHERE teacher_code IS NOT NULL;

-- Optimization for timetable, grades, and enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON public.enrollments(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON public.timetable_slots(class_id);
```

## 📋 Detailed Table Schema Registry

Below is the schema specification of all tables in the database, compiled directly from the live OpenAPI reflection:

### 📁 Table: `academic_years`
*Description:* Academic year definitions (e.g. 2024-2025)

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `start_date` | `string` | `date` |  | No |
| `end_date` | `string` | `date` |  | No |
| `is_current` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `all_teachers`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `full_name` | `string` | `text` |  | No |
| `email` | `string` | `text` |  | No |
| `phone` | `string` | `text` |  | No |
| `photo_url` | `string` | `text` |  | No |
| `department` | `string` | `text` |  | No |
| `teacher_type` | `string` | `public.teacher_type` |  | No |
| `specialization` | `string` | `text` |  | No |
| `teaching_subjects` | `array` | `uuid[]` |  | No |
| `hourly_rate` | `number` | `numeric` |  | No |
| `bio` | `string` | `text` |  | No |
| `display_type` | `string` | `text` |  | No |

---

### 📁 Table: `announcements`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `title` | `string` | `text` |  | No |
| `content` | `string` | `text` |  | No |
| `type` | `string` | `text` |  | No |
| `is_published` | `boolean` | `boolean` |  | No |
| `published_at` | `string` | `timestamp with time zone` |  | No |
| `expires_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `assignment_categories`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `weight` | `number` | `numeric` |  | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `assignments`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `category_id` | `string` | `uuid` | Note: This is a Foreign Key to `assignment_categories.id`.<fk table='assignment_categories' column='id'/> | No |
| `title` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `due_date` | `string` | `date` |  | No |
| `max_points` | `number` | `numeric` |  | No |
| `teacher_id` | `string` | `uuid` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `attendance`
*Description:* Daily attendance records. Links to classes and students.

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `date` | `string` | `date` |  | No |
| `status` | `string` | `text` |  | No |
| `remarks` | `string` | `text` |  | No |
| `marked_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `timetable_slot_id` | `string` | `uuid` | Note: This is a Foreign Key to `timetable_slots.id`.<fk table='timetable_slots' column='id'/> | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `attendance_reports`
*Description:* Pre-generated attendance summary reports.

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `report_type` | `string` | `character varying` |  | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `date_from` | `string` | `date` |  | No |
| `date_to` | `string` | `date` |  | No |
| `total_days` | `integer` | `integer` |  | No |
| `present_count` | `integer` | `integer` |  | No |
| `absent_count` | `integer` | `integer` |  | No |
| `late_count` | `integer` | `integer` |  | No |
| `excused_count` | `integer` | `integer` |  | No |
| `attendance_rate` | `number` | `numeric` |  | No |
| `report_data` | `unknown` | `jsonb` |  | No |
| `generated_at` | `string` | `timestamp with time zone` |  | No |
| `generated_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `audit_logs`
*Description:* Tracks all important user actions for auditing purposes (Recovered)

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `user_email` | `string` | `text` |  | No |
| `action` | `string` | `text` |  | No |
| `resource_type` | `string` | `text` |  | No |
| `resource_id` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `old_data` | `unknown` | `jsonb` |  | No |
| `new_data` | `unknown` | `jsonb` |  | No |
| `ip_address` | `string` | `text` |  | No |
| `user_agent` | `string` | `text` |  | No |

---

### 📁 Table: `calendar_events`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `title` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `event_type` | `string` | `text` |  | No |
| `start_date` | `string` | `date` |  | No |
| `end_date` | `string` | `date` |  | No |
| `start_time` | `string` | `time without time zone` |  | No |
| `end_time` | `string` | `time without time zone` |  | No |
| `is_all_day` | `boolean` | `boolean` |  | No |
| `semester_id` | `string` | `uuid` | Note: This is a Foreign Key to `semesters.id`.<fk table='semesters' column='id'/> | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `color` | `string` | `text` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `class_statistics`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `class_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `class_name` | `string` | `text` |  | No |
| `total_students` | `integer` | `bigint` |  | No |
| `total_attendance_records` | `integer` | `bigint` |  | No |
| `present_count` | `integer` | `bigint` |  | No |
| `attendance_rate` | `number` | `numeric` |  | No |

---

### 📁 Table: `classes`
*Description:* PRIMARY table for class/course management.

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `teacher_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `grade_level` | `string` | `text` |  | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `subject_group_id` | `string` | `uuid` |  | No |
| `max_capacity` | `integer` | `integer` |  | No |
| `sessions_per_week` | `integer` | `integer` |  | No |
| `class_type` | `string` | `character varying` |  | No |
| `course_id` | `string` | `uuid` | Note: This is a Foreign Key to `courses.id`.<fk table='courses' column='id'/> | No |
| `status` | `string` | `text` |  | No |
| `room` | `string` | `text` |  | No |
| `schedule` | `string` | `text` |  | No |
| `capacity` | `integer` | `integer` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `courses`
*Description:* Stores course/curriculum information for the school

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `code` | `string` | `text` |  | No |
| `name` | `string` | `text` |  | No |
| `name_vi` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `grade_level` | `integer` | `integer` |  | No |
| `credits` | `integer` | `integer` |  | No |
| `hours_per_week` | `integer` | `integer` |  | No |
| `is_required` | `boolean` | `boolean` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `semester` | `integer` | `integer` |  | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `enrollments`
*Description:* Student enrollments in classes

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `enrollment_date` | `string` | `date` | Date when student enrolled | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `status` | `string` | `public.enrollment_status` |  | No |

---

### 📁 Table: `evaluation_types`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `code` | `string` | `text` |  | No |
| `weight` | `integer` | `integer` |  | No |
| `description` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `fee_assignments`
*Description:* Assigns fees to classes for specific academic years

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `fee_type_id` | `string` | `uuid` | Note: This is a Foreign Key to `fee_types.id`.<fk table='fee_types' column='id'/> | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `amount` | `number` | `numeric` |  | No |
| `description` | `string` | `text` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `fee_types`
*Description:* Defines types of fees (tuition, facility, activity, exam, etc)

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `code` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `category` | `string` | `public.fee_category` |  | No |

---

### 📁 Table: `grades`
*Description:* Student grades for assignments

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `assignment_id` | `string` | `uuid` |  | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `score` | `number` | `numeric` |  | No |
| `feedback` | `string` | `text` |  | No |
| `graded_at` | `string` | `timestamp with time zone` |  | No |
| `graded_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `points_earned` | `number` | `numeric` |  | No |
| `component_type` | `string` | `text` |  | No |
| `semester` | `string` | `text` |  | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `category_id` | `string` | `uuid` |  | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |

---

### 📁 Table: `grading_scales`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `scale` | `unknown` | `jsonb` |  | No |
| `is_default` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `import_errors`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `import_log_id` | `string` | `uuid` | Note: This is a Foreign Key to `import_logs.id`.<fk table='import_logs' column='id'/> | No |
| `row_number` | `integer` | `integer` |  | No |
| `field_name` | `string` | `character varying` |  | No |
| `error_type` | `string` | `character varying` |  | No |
| `error_message` | `string` | `text` |  | No |
| `row_data` | `unknown` | `jsonb` |  | No |
| `severity` | `string` | `character varying` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `import_logs`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `imported_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `import_type` | `string` | `character varying` |  | No |
| `file_name` | `string` | `character varying` |  | No |
| `file_size` | `integer` | `integer` |  | No |
| `total_rows` | `integer` | `integer` |  | No |
| `processed_rows` | `integer` | `integer` |  | No |
| `success_count` | `integer` | `integer` |  | No |
| `error_count` | `integer` | `integer` |  | No |
| `warning_count` | `integer` | `integer` |  | No |
| `status` | `string` | `character varying` |  | No |
| `error_summary` | `string` | `text` |  | No |
| `started_at` | `string` | `timestamp with time zone` |  | No |
| `completed_at` | `string` | `timestamp with time zone` |  | No |
| `duration_seconds` | `integer` | `integer` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `invoice_items`
*Description:* Line items on invoices detailing what fees are being charged

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `invoice_id` | `string` | `uuid` | Note: This is a Foreign Key to `invoices.id`.<fk table='invoices' column='id'/> | No |
| `fee_type_id` | `string` | `uuid` | Note: This is a Foreign Key to `fee_types.id`.<fk table='fee_types' column='id'/> | No |
| `description` | `string` | `text` |  | No |
| `quantity` | `integer` | `integer` |  | No |
| `unit_price` | `number` | `numeric` |  | No |
| `total_price` | `number` | `numeric` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `invoices`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `invoice_number` | `string` | `text` |  | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `student_account_id` | `string` | `uuid` | Note: This is a Foreign Key to `student_accounts.id`.<fk table='student_accounts' column='id'/> | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `issue_date` | `string` | `date` |  | No |
| `due_date` | `string` | `date` |  | No |
| `total_amount` | `number` | `numeric` |  | No |
| `paid_amount` | `number` | `numeric` |  | No |
| `status` | `string` | `public.invoice_status` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `notifications`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `title` | `string` | `text` |  | No |
| `message` | `string` | `text` |  | No |
| `type` | `string` | `text` |  | No |
| `is_read` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `parent_student_links`
*Description:* Links parent accounts to their children with approval workflow

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `parent_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `relationship` | `string` | `text` |  | No |
| `status` | `string` | `text` | pending: awaiting staff approval, approved: active link, rejected: denied, revoked: deactivated | No |
| `requested_at` | `string` | `timestamp with time zone` |  | No |
| `reviewed_at` | `string` | `timestamp with time zone` |  | No |
| `reviewed_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `rejection_reason` | `string` | `text` |  | No |
| `can_view_grades` | `boolean` | `boolean` |  | No |
| `can_view_attendance` | `boolean` | `boolean` |  | No |
| `can_view_finance` | `boolean` | `boolean` |  | No |
| `can_view_schedule` | `boolean` | `boolean` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `payment_allocations`
*Description:* Tracks how payments are allocated to specific invoices

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `payment_id` | `string` | `uuid` |  | No |
| `invoice_id` | `string` | `uuid` |  | No |
| `amount` | `number` | `numeric` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `payment_methods`
*Description:* Available payment methods (cash, bank transfer, card, etc)

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `requires_reference` | `boolean` | `boolean` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `type` | `string` | `public.payment_method_type` |  | No |

---

### 📁 Table: `payment_schedule_installments`
*Description:* Individual installments in a payment schedule

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `schedule_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `installment_number` | `integer` | `integer` | Note: This is a Primary Key.<pk/> | No |
| `due_date` | `string` | `date` |  | No |
| `percentage` | `number` | `numeric` |  | No |
| `description` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `payment_schedules`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `schedule_type` | `string` | `public.schedule_type` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `payments`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `invoice_id` | `string` | `uuid` | Note: This is a Foreign Key to `invoices.id`.<fk table='invoices' column='id'/> | No |
| `payment_method_id` | `string` | `uuid` | Note: This is a Foreign Key to `payment_methods.id`.<fk table='payment_methods' column='id'/> | No |
| `amount` | `number` | `numeric` |  | No |
| `reference_number` | `string` | `text` |  | No |
| `payment_date` | `string` | `date` |  | No |
| `received_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `notes` | `string` | `text` |  | No |
| `status` | `string` | `public.payment_status` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `permission_audit_logs`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `action` | `string` | `character varying` |  | No |
| `user_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `permission_code` | `string` | `character varying` |  | No |
| `performed_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `old_value` | `unknown` | `jsonb` |  | No |
| `new_value` | `unknown` | `jsonb` |  | No |
| `reason` | `string` | `text` |  | No |
| `ip_address` | `string` | `inet` |  | No |
| `user_agent` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `scope` | `string` | `text` |  | No |

---

### 📁 Table: `permission_definitions`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `code` | `string` | `character varying` |  | No |
| `name` | `string` | `character varying` |  | No |
| `description` | `string` | `text` |  | No |
| `resource` | `string` | `character varying` |  | No |
| `action` | `string` | `character varying` |  | No |
| `category` | `string` | `character varying` |  | No |
| `is_system` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `profiles`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `first_name` | `string` | `text` |  | No |
| `last_name` | `string` | `text` | User last name | No |
| `full_name` | `string` | `text` | Auto-computed full name from first_name and last_name | No |
| `email` | `string` | `text` | User email address (synced from auth.users) | No |
| `date_of_birth` | `string` | `date` | Date of birth | No |
| `phone` | `string` | `text` | Contact phone number | No |
| `address` | `string` | `text` | Residential address | No |
| `emergency_contact` | `string` | `text` | Emergency contact information (phone or email) | No |
| `role` | `string` | `text` | User roles: super_admin, owner, admin, staff, teacher, tutor, parent, student | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `student_id` | `string` | `text` | Unique student ID number (school-assigned) | No |
| `grade_level` | `string` | `text` | Current grade level | No |
| `gender` | `string` | `character varying` | Gender | No |
| `enrollment_date` | `string` | `date` | Date when student enrolled | No |
| `status` | `string` | `character varying` | User status (active/inactive/etc) | No |
| `photo_url` | `string` | `text` | URL to profile photo | No |
| `department` | `string` | `text` | Department (for teachers/staff) | No |
| `is_active` | `boolean` | `boolean` | Whether user account is active | No |
| `created_by` | `string` | `uuid` | User ID who created this profile | No |
| `notes` | `string` | `text` | Additional notes | No |
| `student_code` | `string` | `character varying` | Vietnamese student code format: HS + Year + 3-digit sequential (e.g., HS2025001).  Legacy format STU-YYYY-NNNN supported for backward compatibility. | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `phone_verified` | `boolean` | `boolean` |  | No |
| `preferred_auth_method` | `string` | `text` |  | No |
| `account_status` | `string` | `text` |  | No |
| `status_changed_at` | `string` | `timestamp with time zone` |  | No |
| `status_changed_by` | `string` | `uuid` |  | No |
| `status_note` | `string` | `text` | Reason for suspension or deactivation | No |
| `is_managed` | `boolean` | `boolean` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `updated_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `personal_email` | `string` | `text` |  | No |
| `teacher_code` | `string` | `text` | UID (Mã truy cập) for Teachers, Staff, and Tutors | No |

---

### 📁 Table: `qr_codes`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `token` | `string` | `text` |  | No |
| `valid_until` | `string` | `timestamp with time zone` |  | No |
| `used_at` | `string` | `timestamp with time zone` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `role_permission_overrides`
*Description:* Super Admin configured overrides on top of code-defined role defaults. is_denied=false adds a permission, is_denied=true removes one.

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `role` | `string` | `text` |  | No |
| `permission_code` | `string` | `text` | Note: This is a Foreign Key to `permission_definitions.code`.<fk table='permission_definitions' column='code'/> | No |
| `is_denied` | `boolean` | `boolean` |  | No |
| `granted_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `role_permissions`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `role` | `string` | `character varying` |  | No |
| `permission_code` | `string` | `character varying` | Note: This is a Foreign Key to `permission_definitions.code`.<fk table='permission_definitions' column='code'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `school_settings`
*Description:* School-wide configuration settings

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `key` | `string` | `text` |  | No |
| `value` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `semesters`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `code` | `string` | `text` |  | No |
| `start_date` | `string` | `date` |  | No |
| `end_date` | `string` | `date` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `settings`
*Description:* Key-value store for school configuration settings

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `key` | `string` | `text` |  | No |
| `value` | `string` | `text` |  | No |
| `value_json` | `unknown` | `jsonb` |  | No |
| `description` | `string` | `text` |  | No |
| `category` | `string` | `text` |  | No |
| `is_public` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `student_accounts`
*Description:* Tracks student financial account balances and status per academic year

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `balance` | `number` | `numeric` |  | No |
| `total_fees` | `number` | `numeric` |  | No |
| `total_paid` | `number` | `numeric` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `status` | `string` | `public.account_status` |  | No |

---

### 📁 Table: `student_conducts`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `term` | `string` | `text` |  | No |
| `rating` | `string` | `text` |  | No |
| `comments` | `string` | `text` |  | No |
| `evaluated_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `evaluated_at` | `string` | `timestamp with time zone` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `student_documents`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` |  | No |
| `name` | `string` | `text` |  | No |
| `type` | `string` | `text` |  | No |
| `url` | `string` | `text` |  | No |
| `size` | `integer` | `integer` |  | No |
| `storage_path` | `string` | `text` |  | No |
| `uploaded_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `uploaded_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `student_notes`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `content` | `string` | `text` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `student_performance_summary`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `student_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `full_name` | `string` | `text` |  | No |
| `student_code` | `string` | `character varying` |  | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `class_name` | `string` | `text` |  | No |
| `subjects_count` | `integer` | `bigint` |  | No |
| `average_score` | `number` | `numeric` |  | No |

---

### 📁 Table: `student_profiles`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `profile_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `student_code` | `string` | `character varying` |  | No |
| `grade_level` | `string` | `text` |  | No |
| `enrollment_date` | `string` | `date` |  | No |
| `parent_name` | `string` | `text` |  | No |
| `parent_phone` | `string` | `text` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `subjects`
*Description:* Academic subjects (Math, Science, etc.)

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `code` | `string` | `text` |  | No |
| `description` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `credits` | `integer` | `integer` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `teacher_profiles`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `profile_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `department` | `string` | `text` |  | No |
| `specialization` | `string` | `text` |  | No |
| `teaching_subjects` | `array` | `uuid[]` |  | No |
| `hourly_rate` | `number` | `numeric` |  | No |
| `bio` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |
| `teacher_type` | `string` | `public.teacher_type` |  | No |

---

### 📁 Table: `teacher_subjects`
*Description:* Many-to-many relationship between teachers and subjects they can teach

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `profile_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `is_primary` | `boolean` | `boolean` | Marks the teacher's primary/main subject | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `teacher_workload`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `teacher_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `full_name` | `string` | `text` |  | No |
| `classes_assigned` | `integer` | `bigint` |  | No |
| `total_slots` | `integer` | `bigint` |  | No |
| `total_hours_per_week` | `number` | `numeric` |  | No |

---

### 📁 Table: `timetable_slots`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `class_id` | `string` | `uuid` | Note: This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/> | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `teacher_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `semester_id` | `string` | `uuid` | Note: This is a Foreign Key to `semesters.id`.<fk table='semesters' column='id'/> | No |
| `day_of_week` | `integer` | `integer` |  | No |
| `start_time` | `string` | `time without time zone` |  | No |
| `end_time` | `string` | `time without time zone` |  | No |
| `room` | `string` | `text` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `student_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |

---

### 📁 Table: `tuition_config`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `class_type` | `string` | `character varying` |  | No |
| `sessions_per_week` | `integer` | `integer` |  | No |
| `monthly_fee` | `number` | `numeric` |  | No |
| `description` | `string` | `text` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `tutors`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `full_name` | `string` | `text` |  | No |
| `email` | `string` | `text` |  | No |
| `phone` | `string` | `text` |  | No |
| `photo_url` | `string` | `text` |  | No |
| `teacher_type` | `string` | `public.teacher_type` |  | No |
| `specialization` | `string` | `text` |  | No |
| `teaching_subjects` | `array` | `uuid[]` |  | No |
| `hourly_rate` | `number` | `numeric` |  | No |
| `bio` | `string` | `text` |  | No |

---

### 📁 Table: `user_invitations`
*Description:* Manages invite tokens for role-based user registration

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `email` | `string` | `text` |  | No |
| `phone` | `string` | `text` |  | No |
| `role` | `string` | `text` |  | No |
| `token` | `string` | `text` | Secure random token sent to invitee | No |
| `expires_at` | `string` | `timestamp with time zone` |  | No |
| `invited_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `used_at` | `string` | `timestamp with time zone` |  | No |
| `used_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `metadata` | `unknown` | `jsonb` | Additional data like department, subjects to teach, etc. | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `user_permissions`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `permission_code` | `string` | `character varying` |  | No |
| `granted_by` | `string` | `uuid` |  | No |
| `granted_at` | `string` | `timestamp with time zone` |  | No |
| `expires_at` | `string` | `timestamp with time zone` |  | No |
| `is_denied` | `boolean` | `boolean` |  | No |
| `notes` | `string` | `text` |  | No |

---

### 📁 Table: `v_active_classes`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `name` | `string` | `text` |  | No |
| `teacher_id` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `grade_level` | `string` | `text` |  | No |
| `academic_year_id` | `string` | `uuid` | Note: This is a Foreign Key to `academic_years.id`.<fk table='academic_years' column='id'/> | No |
| `subject_group_id` | `string` | `uuid` |  | No |
| `max_capacity` | `integer` | `integer` |  | No |
| `sessions_per_week` | `integer` | `integer` |  | No |
| `class_type` | `string` | `character varying` |  | No |
| `course_id` | `string` | `uuid` | Note: This is a Foreign Key to `courses.id`.<fk table='courses' column='id'/> | No |
| `status` | `string` | `text` |  | No |
| `room` | `string` | `text` |  | No |
| `schedule` | `string` | `text` |  | No |
| `capacity` | `integer` | `integer` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `updated_by` | `string` | `uuid` |  | No |
| `course_name` | `string` | `text` |  | No |
| `teacher_name` | `string` | `text` |  | No |

---

### 📁 Table: `v_active_profiles`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `first_name` | `string` | `text` |  | No |
| `last_name` | `string` | `text` |  | No |
| `full_name` | `string` | `text` |  | No |
| `email` | `string` | `text` |  | No |
| `date_of_birth` | `string` | `date` |  | No |
| `phone` | `string` | `text` |  | No |
| `address` | `string` | `text` |  | No |
| `emergency_contact` | `string` | `text` |  | No |
| `role` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `student_id` | `string` | `text` |  | No |
| `grade_level` | `string` | `text` |  | No |
| `gender` | `string` | `character varying` |  | No |
| `enrollment_date` | `string` | `date` |  | No |
| `status` | `string` | `character varying` |  | No |
| `photo_url` | `string` | `text` |  | No |
| `department` | `string` | `text` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `notes` | `string` | `text` |  | No |
| `student_code` | `string` | `character varying` |  | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `phone_verified` | `boolean` | `boolean` |  | No |
| `preferred_auth_method` | `string` | `text` |  | No |
| `account_status` | `string` | `text` |  | No |
| `status_changed_at` | `string` | `timestamp with time zone` |  | No |
| `status_changed_by` | `string` | `uuid` |  | No |
| `status_note` | `string` | `text` |  | No |
| `is_managed` | `boolean` | `boolean` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `updated_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |

---

### 📁 Table: `v_active_students`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `user_id` | `string` | `uuid` |  | No |
| `first_name` | `string` | `text` |  | No |
| `last_name` | `string` | `text` |  | No |
| `full_name` | `string` | `text` |  | No |
| `email` | `string` | `text` |  | No |
| `date_of_birth` | `string` | `date` |  | No |
| `phone` | `string` | `text` |  | No |
| `address` | `string` | `text` |  | No |
| `emergency_contact` | `string` | `text` |  | No |
| `role` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |
| `student_id` | `string` | `text` |  | No |
| `grade_level` | `string` | `text` |  | No |
| `gender` | `string` | `character varying` |  | No |
| `enrollment_date` | `string` | `date` |  | No |
| `status` | `string` | `character varying` |  | No |
| `photo_url` | `string` | `text` |  | No |
| `department` | `string` | `text` |  | No |
| `is_active` | `boolean` | `boolean` |  | No |
| `created_by` | `string` | `uuid` |  | No |
| `notes` | `string` | `text` |  | No |
| `student_code` | `string` | `character varying` |  | No |
| `subject_id` | `string` | `uuid` | Note: This is a Foreign Key to `subjects.id`.<fk table='subjects' column='id'/> | No |
| `phone_verified` | `boolean` | `boolean` |  | No |
| `preferred_auth_method` | `string` | `text` |  | No |
| `account_status` | `string` | `text` |  | No |
| `status_changed_at` | `string` | `timestamp with time zone` |  | No |
| `status_changed_by` | `string` | `uuid` |  | No |
| `status_note` | `string` | `text` |  | No |
| `is_managed` | `boolean` | `boolean` |  | No |
| `deleted_at` | `string` | `timestamp with time zone` |  | No |
| `updated_by` | `string` | `uuid` | Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | No |
| `sp_student_code` | `string` | `character varying` |  | No |
| `sp_grade_level` | `string` | `text` |  | No |

---

### 📁 Table: `v_teacher_subjects`
*Description:* Convenient view for querying teacher-subject relationships

| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `profile_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `full_name` | `string` | `text` |  | No |
| `email` | `string` | `text` |  | No |
| `subject_id` | `string` | `uuid` | Note: This is a Primary Key.<pk/> | No |
| `subject_name` | `string` | `text` |  | No |
| `subject_code` | `string` | `text` |  | No |
| `is_primary` | `boolean` | `boolean` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |

---

### 📁 Table: `weekly_notes`
| Column | Type | Format | Key Type / Notes | Nullable |
|---|---|---|---|---|
| `id` | `string` | `uuid` | Primary Key | No |
| `slot_id` | `string` | `uuid` | Note: This is a Foreign Key to `timetable_slots.id`.<fk table='timetable_slots' column='id'/> | No |
| `week_start_date` | `string` | `date` |  | No |
| `notes` | `string` | `text` |  | No |
| `created_at` | `string` | `timestamp with time zone` |  | No |
| `updated_at` | `string` | `timestamp with time zone` |  | No |

---

